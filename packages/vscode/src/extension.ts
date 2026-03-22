import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

// ─── Activation ──────────────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext) {
  console.log('Block Builder extension activated')

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('block-builder.open', () => openEditor(context)),
    vscode.commands.registerCommand('block-builder.generate', () => generateCode()),
    vscode.commands.registerCommand('block-builder.init', () => initCanvas()),
    vscode.commands.registerCommand('block-builder.preview', () => previewCode(context)),
    vscode.commands.registerCommand('block-builder.insertCode', () => insertCode()),
  )

  // Auto-generate on canvas.json save
  const cfg = vscode.workspace.getConfiguration('blockBuilder')
  if (cfg.get('autoGenerate')) {
    const watcher = vscode.workspace.createFileSystemWatcher('**/canvas.json')
    watcher.onDidChange(async (uri) => {
      const choice = await vscode.window.showInformationMessage(
        'canvas.json changed. Regenerate code?',
        'Generate', 'Dismiss'
      )
      if (choice === 'Generate') await generateCode(uri)
    })
    context.subscriptions.push(watcher)
  }

  // Status bar item
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
  statusBar.text = '$(symbol-structure) Block Builder'
  statusBar.command = 'block-builder.open'
  statusBar.tooltip = 'Open Block Builder Visual Editor'
  statusBar.show()
  context.subscriptions.push(statusBar)
}

export function deactivate() {}

// ─── Open editor in webview panel ────────────────────────────────────
function openEditor(context: vscode.ExtensionContext) {
  const cfg = vscode.workspace.getConfiguration('blockBuilder')
  const serverUrl = cfg.get<string>('serverUrl') ?? 'http://localhost:3000'

  const panel = vscode.window.createWebviewPanel(
    'blockBuilder',
    'Block Builder',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  )

  panel.webview.html = getWebviewHtml(serverUrl)

  // Handle messages from webview
  panel.webview.onDidReceiveMessage(async (msg) => {
    switch (msg.type) {
      case 'saveCanvas': {
        const ws = vscode.workspace.workspaceFolders?.[0]
        if (!ws) return
        const canvasPath = path.join(ws.uri.fsPath, 'canvas.json')
        fs.writeFileSync(canvasPath, JSON.stringify(msg.canvas, null, 2))
        vscode.window.showInformationMessage('✅ canvas.json saved!')
        break
      }
      case 'generateCode': {
        await generateCode()
        break
      }
      case 'insertFile': {
        await insertGeneratedFile(msg.path, msg.content)
        break
      }
    }
  })
}

// ─── Generate code via CLI ────────────────────────────────────────────
async function generateCode(uri?: vscode.Uri) {
  const ws = vscode.workspace.workspaceFolders?.[0]
  if (!ws) {
    vscode.window.showErrorMessage('No workspace folder open')
    return
  }

  const cfg = vscode.workspace.getConfiguration('blockBuilder')
  const outputDir = cfg.get<string>('outputDir') ?? './generated'

  const canvasPath = uri?.fsPath ?? path.join(ws.uri.fsPath, 'canvas.json')
  if (!fs.existsSync(canvasPath)) {
    const choice = await vscode.window.showErrorMessage(
      'canvas.json not found.',
      'Initialize canvas.json'
    )
    if (choice) await initCanvas()
    return
  }

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Block Builder: Generating code...',
    cancellable: false,
  }, async (progress) => {
    try {
      progress.report({ increment: 20, message: 'Reading canvas...' })

      // Dynamically import codegen
      const raw = fs.readFileSync(canvasPath, 'utf-8')
      const canvas = JSON.parse(raw)

      progress.report({ increment: 40, message: 'Generating files...' })

      // Call our codegen via the API server if available, otherwise use npx
      const apiUrl = cfg.get<string>('apiUrl') ?? 'http://localhost:3001'
      let generated: any

      try {
        const res = await fetch(`${apiUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvas: { nodes: canvas.nodes, edges: canvas.edges ?? [], viewport: { x: 0, y: 0, zoom: 1 } },
            settings: canvas.settings ?? {
              framework: cfg.get('framework') ?? 'react',
              apiFramework: cfg.get('apiFramework') ?? 'hono',
              packageManager: 'pnpm',
            },
          }),
        })
        generated = await res.json()
      } catch {
        vscode.window.showErrorMessage('Block Builder server not running. Start it with `pnpm dev` in block-builder/apps/server')
        return
      }

      progress.report({ increment: 30, message: 'Writing files...' })

      const outDir = path.resolve(ws.uri.fsPath, outputDir)
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

      let written = 0
      for (const file of (generated.files ?? [])) {
        const filePath = path.join(outDir, file.path)
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(filePath, file.content)
        written++
      }

      progress.report({ increment: 10, message: 'Done!' })
      vscode.window.showInformationMessage(
        `✅ Generated ${written} files in ${outputDir}`,
        'Open Folder'
      ).then(choice => {
        if (choice) vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outDir))
      })
    } catch (e: any) {
      vscode.window.showErrorMessage('Generation failed: ' + e.message)
    }
  })
}

// ─── Init canvas.json ─────────────────────────────────────────────────
async function initCanvas() {
  const ws = vscode.workspace.workspaceFolders?.[0]
  if (!ws) return

  const name = await vscode.window.showInputBox({ prompt: 'Project name', value: 'My Project' })
  if (!name) return

  const framework = await vscode.window.showQuickPick(['react', 'vue', 'svelte'], { placeHolder: 'Frontend framework' })
  const apiFramework = await vscode.window.showQuickPick(['hono', 'nestjs', 'express', 'graphql', 'trpc'], { placeHolder: 'API framework' })

  const canvas = {
    name,
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    settings: { framework: framework ?? 'react', apiFramework: apiFramework ?? 'hono', packageManager: 'pnpm' },
  }

  const canvasPath = path.join(ws.uri.fsPath, 'canvas.json')
  fs.writeFileSync(canvasPath, JSON.stringify(canvas, null, 2))

  const doc = await vscode.workspace.openTextDocument(canvasPath)
  await vscode.window.showTextDocument(doc)
  vscode.window.showInformationMessage('✅ canvas.json created! Open Block Builder to start designing.')
}

// ─── Preview generated code ────────────────────────────────────────────
async function previewCode(context: vscode.ExtensionContext) {
  const ws = vscode.workspace.workspaceFolders?.[0]
  if (!ws) return

  const genDir = path.join(ws.uri.fsPath, 'generated')
  if (!fs.existsSync(genDir)) {
    vscode.window.showWarningMessage('No generated folder found. Run "Block Builder: Generate Code" first.')
    return
  }

  // Get all generated files
  const allFiles = getAllFiles(genDir)
  const items = allFiles.map(f => ({
    label: path.relative(genDir, f),
    description: getFileSize(f),
    detail: f,
  }))

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a file to preview',
    matchOnDescription: true,
  })

  if (selected?.detail) {
    const doc = await vscode.workspace.openTextDocument(selected.detail)
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
  }
}

// ─── Insert generated file into workspace ────────────────────────────
async function insertGeneratedFile(filePath: string, content: string) {
  const ws = vscode.workspace.workspaceFolders?.[0]
  if (!ws) return

  const targetPath = path.join(ws.uri.fsPath, 'src', filePath)
  const dir = path.dirname(targetPath)

  if (!fs.existsSync(dir)) {
    const choice = await vscode.window.showInformationMessage(
      `Create directory ${path.relative(ws.uri.fsPath, dir)}?`, 'Yes', 'No'
    )
    if (choice !== 'Yes') return
    fs.mkdirSync(dir, { recursive: true })
  }

  if (fs.existsSync(targetPath)) {
    const choice = await vscode.window.showWarningMessage(
      `${filePath} already exists. Overwrite?`, 'Overwrite', 'Cancel'
    )
    if (choice !== 'Overwrite') return
  }

  fs.writeFileSync(targetPath, content)
  const doc = await vscode.workspace.openTextDocument(targetPath)
  await vscode.window.showTextDocument(doc)
}

async function insertCode() {
  vscode.window.showInformationMessage('Use Block Builder editor to select files to insert.')
}

// ─── Webview HTML ─────────────────────────────────────────────────────
function getWebviewHtml(serverUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Block Builder</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
    .toolbar { background: #16213e; padding: 8px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #0f3460; flex-shrink: 0; }
    .toolbar h1 { color: #e6f1fb; font-size: 14px; font-weight: 600; }
    .toolbar button { padding: 6px 14px; font-size: 12px; font-weight: 500; border: none; border-radius: 6px; cursor: pointer; transition: all .15s; }
    .btn-save { background: #0f3460; color: #e6f1fb; }
    .btn-generate { background: #185FA5; color: white; }
    .btn-save:hover { background: #1a4d8a; }
    .btn-generate:hover { background: #0C447C; }
    .status { color: #888; font-size: 11px; margin-left: auto; }
    iframe { flex: 1; border: none; width: 100%; }
    .connecting { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; gap: 16px; }
    .connecting h2 { color: #e6f1fb; font-size: 16px; }
    .url { font-family: monospace; font-size: 12px; background: #0f3460; padding: 6px 12px; border-radius: 6px; color: #89b4fa; }
    .spinner { width: 32px; height: 32px; border: 3px solid #0f3460; border-top-color: #185FA5; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="toolbar">
    <h1>⊞ Block Builder</h1>
    <button class="btn-save" onclick="saveCanvas()">💾 Save canvas.json</button>
    <button class="btn-generate" onclick="generateCode()">▶ Generate Code</button>
    <span class="status" id="status">Connecting...</span>
  </div>
  <div id="container" class="connecting">
    <div class="spinner"></div>
    <h2>Opening Block Builder...</h2>
    <div class="url">${serverUrl}</div>
    <p style="font-size:12px">Make sure Block Builder is running locally</p>
  </div>

  <script>
    const vscode = acquireVsCodeApi()
    let frameLoaded = false

    // Try to load Block Builder iframe
    const container = document.getElementById('container')
    const iframe = document.createElement('iframe')
    iframe.src = '${serverUrl}'
    iframe.style.cssText = 'flex:1;border:none;width:100%;display:none'
    iframe.onload = () => {
      frameLoaded = true
      container.style.display = 'none'
      iframe.style.display = 'block'
      document.getElementById('status').textContent = 'Connected'
    }
    iframe.onerror = () => {
      document.getElementById('status').textContent = 'Cannot connect to ' + '${serverUrl}'
    }
    document.body.appendChild(iframe)

    function saveCanvas() {
      if (!frameLoaded) return
      try {
        // Try to get canvas from Block Builder via postMessage
        iframe.contentWindow.postMessage({ type: 'bb:export-canvas' }, '*')
      } catch {
        vscode.postMessage({ type: 'saveCanvas', canvas: { nodes: [], edges: [], name: 'VSCode Project' } })
      }
    }

    function generateCode() {
      vscode.postMessage({ type: 'generateCode' })
    }

    // Listen for messages from Block Builder iframe
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'bb:canvas-export') {
        vscode.postMessage({ type: 'saveCanvas', canvas: e.data.canvas })
        document.getElementById('status').textContent = 'Saved ✓'
        setTimeout(() => document.getElementById('status').textContent = 'Connected', 2000)
      }
    })
  </script>
</body>
</html>`
}

// ─── Helpers ──────────────────────────────────────────────────────────
function getAllFiles(dir: string, files: string[] = []): string[] {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) getAllFiles(full, files)
    else files.push(full)
  }
  return files
}

function getFileSize(p: string): string {
  const bytes = fs.statSync(p).size
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}
