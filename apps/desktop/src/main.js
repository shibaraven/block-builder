const { app, BrowserWindow, Menu, shell, ipcMain, dialog, nativeTheme, session } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')
const net = require('net')

const isDev = !app.isPackaged
let mainWindow = null
let webServer = null
let webPort = 3456

function getWebDist() {
  const p = path.join(process.resourcesPath, 'web')
  if (fs.existsSync(path.join(p, 'index.html'))) return p
  // Dev fallback
  const d = path.join(__dirname, '../../../apps/web/dist')
  if (fs.existsSync(path.join(d, 'index.html'))) return d
  return null
}

function getFreePort() {
  return new Promise(resolve => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close(() => resolve(port))
    })
  })
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png', '.jpg': 'image/jpeg',
  '.svg':  'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt':  'text/plain', '.map': 'application/json',
}

async function startWebServer(webPath) {
  webPort = await getFreePort()
  return new Promise((resolve, reject) => {
    webServer = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0])
      let file = path.join(webPath, urlPath === '/' ? 'index.html' : urlPath)
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(webPath, 'index.html')
      }
      try {
        const ext = path.extname(file).toLowerCase()
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        })
        res.end(fs.readFileSync(file))
      } catch {
        res.writeHead(404); res.end('Not found')
      }
    })
    webServer.listen(webPort, '127.0.0.1', () => {
      console.log('[BB] Web server on port', webPort)
      resolve()
    })
    webServer.on('error', reject)
  })
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920,
    minWidth: 960, minHeight: 640,
    title: 'Block Builder',
    backgroundColor: '#fafaf8',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    if (webServer) webServer.close()
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url); return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    const webPath = getWebDist()
    if (!webPath) {
      mainWindow.loadURL('data:text/html,' + encodeURIComponent(
        '<h2 style="font-family:sans-serif;padding:2rem;color:red">web/dist not found</h2>'
      ))
      mainWindow.show()
      return
    }
    try {
      await startWebServer(webPath)
      // Give server 200ms to be ready
      await new Promise(r => setTimeout(r, 200))
      await mainWindow.loadURL('http://127.0.0.1:' + webPort)
    } catch (e) {
      console.error('[BB] Failed to start server:', e)
      // Last resort fallback
      mainWindow.loadURL('data:text/html,' + encodeURIComponent(
        '<h2 style="font-family:sans-serif;padding:2rem;color:red">Error: ' + e.message + '</h2>'
      ))
    }
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
  buildMenu()
}

function buildMenu() {
  const fire = e => () => mainWindow?.webContents.executeJavaScript(
    `window.dispatchEvent(new CustomEvent(${JSON.stringify(e)}))`
  )
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label:'Block Builder', submenu:[
      {label:'About',role:'about'},{type:'separator'},
      {label:'Preferences',accelerator:'CmdOrCtrl+,',click:fire('bb:open-settings')},
      {type:'separator'},{label:'Quit',role:'quit'},
    ]},
    { label:'Edit', submenu:[
      {role:'undo'},{role:'redo'},{type:'separator'},
      {role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'},
    ]},
    { label:'View', submenu:[
      {role:'reload'},{role:'forceReload'},{role:'toggleDevTools'},
      {type:'separator'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},
      {type:'separator'},{role:'togglefullscreen'},
    ]},
    { label:'Project', submenu:[
      {label:'New Project',accelerator:'CmdOrCtrl+N',click:fire('bb:new-project')},
      {label:'Save',accelerator:'CmdOrCtrl+S',click:fire('bb:save')},
      {type:'separator'},
      {label:'Generate Code',accelerator:'CmdOrCtrl+G',click:fire('bb:generate')},
      {label:'Export ZIP',accelerator:'CmdOrCtrl+E',click:fire('bb:export')},
    ]},
    { label:'Help', submenu:[
      {label:'Toggle DevTools',role:'toggleDevTools'},
      {label:'Report Issue',click:()=>shell.openExternal('https://github.com')},
    ]},
  ]))
}

ipcMain.handle('get-app-version', () => app.getVersion())
ipcMain.handle('get-platform',    () => process.platform)
ipcMain.handle('open-external',   (_, url) => shell.openExternal(url))
ipcMain.handle('set-theme',       (_, t) => { nativeTheme.themeSource = t })
ipcMain.handle('show-save-dialog', (_, o) => dialog.showSaveDialog(mainWindow, o))
ipcMain.handle('show-open-dialog', (_, o) => dialog.showOpenDialog(mainWindow, o))
ipcMain.handle('write-file', (_, { filePath, content }) => {
  fs.writeFileSync(filePath, content, 'utf-8'); return { success: true }
})
ipcMain.handle('read-file', (_, { filePath }) => fs.readFileSync(filePath, 'utf-8'))

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (webServer) webServer.close()
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
