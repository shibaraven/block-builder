#!/usr/bin/env node
// Block Builder — Pre-start health check
// Runs before dev server to catch TypeScript errors early

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'

let allOk = true

function pass(msg: string)  { console.log(`  ${GREEN}✓${RESET} ${msg}`) }
function fail(msg: string)  { console.log(`  ${RED}✗${RESET} ${msg}`); allOk = false }
function warn(msg: string)  { console.log(`  ${YELLOW}⚠${RESET} ${msg}`) }
function check(label: string, fn: () => void) {
  try { fn(); pass(label) }
  catch (e: any) { fail(`${label}: ${e.message?.slice(0, 120) ?? e}`) }
}

console.log(`\n${BOLD}Block Builder Health Check${RESET}\n`)

// ─── 1. Required files ────────────────────────────────────────────────
console.log('Files:')
const requiredFiles = [
  'apps/web/src/App.tsx',
  'apps/web/src/main.tsx',
  'apps/server/src/index.ts',
  'packages/codegen/src/index.ts',
  'packages/types/src/index.ts',
  'pnpm-workspace.yaml',
  '.env',
]

for (const f of requiredFiles) {
  const path = join(ROOT, f)
  if (existsSync(path)) pass(f)
  else {
    if (f === '.env') warn('.env not found — copy from .env.example')
    else fail(`Missing: ${f}`)
  }
}

// ─── 2. TypeScript check (fast, no emit) ─────────────────────────────
console.log('\nTypeScript:')

const tsProjects = [
  'packages/types',
  'packages/codegen',
]

for (const proj of tsProjects) {
  check(`tsc ${proj}`, () => {
    execSync(`npx tsc --noEmit --project ${proj}/tsconfig.json`, {
      cwd: ROOT,
      stdio: 'pipe',
    })
  })
}

// ─── 3. Generator syntax check ────────────────────────────────────────
console.log('\nGenerators:')

import { readdirSync } from 'fs'
const genDir = join(ROOT, 'packages/codegen/src/generators')
const genFiles = readdirSync(genDir).filter(f => f.endsWith('.ts'))

for (const file of genFiles) {
  check(file, () => {
    const content = readFileSync(join(genDir, file), 'utf-8')
    // Check for raw newlines in string literals (the recurring bug)
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // If a single-quoted string is opened but not closed on the same line
      const singleQuoteContent = line.replace(/\\'/g, '').replace(/"[^"]*"/g, '')
      const openQuotes = (singleQuoteContent.match(/'/g) ?? []).length
      if (openQuotes % 2 !== 0 && !line.trim().startsWith('//') && !line.includes('`')) {
        throw new Error(`Line ${i + 1}: possible unterminated string`)
      }
    }
  })
}

// ─── 4. Node modules ─────────────────────────────────────────────────
console.log('\nDependencies:')
check('node_modules exists', () => {
  if (!existsSync(join(ROOT, 'node_modules'))) throw new Error('Run pnpm install first')
})
check('@block-builder/types resolvable', () => {
  if (!existsSync(join(ROOT, 'packages/types/src/index.ts'))) throw new Error('Types package missing')
})

// ─── Result ───────────────────────────────────────────────────────────
console.log()
if (allOk) {
  console.log(`${GREEN}${BOLD}✅ All checks passed! Starting...${RESET}\n`)
  process.exit(0)
} else {
  console.log(`${RED}${BOLD}❌ Health check failed. Fix errors above before starting.${RESET}\n`)
  process.exit(1)
}
