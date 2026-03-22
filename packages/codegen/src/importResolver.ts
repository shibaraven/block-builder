import * as path from 'path'

// ─── Resolve relative import path between two generated files ─────────
export function resolveImportPath(fromFile: string, toFile: string): string {
  const from = path.dirname('/' + fromFile)
  const to = '/' + toFile.replace(/\.(ts|tsx)$/, '')

  let rel = path.relative(from, to)
  if (!rel.startsWith('.')) rel = './' + rel

  // Normalize Windows backslashes
  return rel.replace(/\\/g, '/')
}

// ─── Get all imports a file needs based on its content ────────────────
export function resolveFileImports(
  filePath: string,
  content: string,
  allFiles: string[]
): string {
  // Find all @import-resolver markers in content (e.g. // @import: User)
  // This is a simple approach: scan for type names used and find their files
  const typePattern = /(?:import type|import)\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
  let match
  const imports: Record<string, string[]> = {}

  while ((match = typePattern.exec(content)) !== null) {
    const types = match[1].split(',').map(t => t.trim()).filter(Boolean)
    const fromPath = match[2]

    if (fromPath.startsWith('.') || fromPath.startsWith('/')) {
      // Relative import — may need path correction
      const absImport = path.resolve('/' + path.dirname(filePath), fromPath)
      // Find the actual file
      const actualFile = allFiles.find(f => {
        const abs = '/' + f.replace(/\.(ts|tsx)$/, '')
        return abs === absImport || abs + '/index' === absImport
      })
      if (actualFile && actualFile !== filePath) {
        const correctedPath = resolveImportPath(filePath, actualFile)
        if (!imports[correctedPath]) imports[correctedPath] = []
        imports[correctedPath].push(...types)
      }
    }
  }

  return content
}

// ─── Fix all import paths in a file ──────────────────────────────────
export function fixImportPaths(
  filePath: string,
  content: string,
  allGeneratedFiles: string[]
): string {
  // Replace wrong relative paths with correct ones
  return content.replace(
    /from\s*['"](\.[^'"]+)['"]/g,
    (match, importPath) => {
      // Resolve what the import points to
      const resolved = path.resolve('/' + path.dirname(filePath), importPath)
        .replace(/^\//, '')

      // Find actual file with that base path
      const found = allGeneratedFiles.find(f => {
        const base = f.replace(/\.(ts|tsx)$/, '')
        return base === resolved || base === resolved + '/index'
      })

      if (found && found !== filePath) {
        const correct = resolveImportPath(filePath, found)
        return `from '${correct}'`
      }
      return match
    }
  )
}

// ─── Generate correct barrel index imports ────────────────────────────
export function generateBarrelExports(files: string[], indexPath: string): string {
  return files
    .filter(f => f !== indexPath)
    .map(f => {
      const rel = resolveImportPath(indexPath, f)
      const basename = path.basename(f, path.extname(f))
      return `export * from '${rel}'`
    })
    .join('\n') + '\n'
}
