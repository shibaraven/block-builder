# Block Builder — VSCode Extension

Visual TypeScript code generator for VSCode.

## Features

- Open Block Builder visual editor inside VSCode (`Ctrl+Shift+B`)
- Generate TypeScript code from `canvas.json` (`Ctrl+Shift+G`)
- Auto-regenerate on canvas changes
- Right-click `canvas.json` → Generate Code

## Setup

1. Make sure Block Builder is running:
   ```bash
   cd D:\PG\block-builder
   pnpm dev
   ```

2. Install this extension from `.vsix`

3. Press `Ctrl+Shift+B` to open

## Commands

| Command | Shortcut |
|---------|----------|
| Open Visual Editor | `Ctrl+Shift+B` |
| Generate Code | `Ctrl+Shift+G` |
| Initialize canvas.json | Command Palette |

## Settings

```json
{
  "blockBuilder.serverUrl": "http://localhost:3000",
  "blockBuilder.apiUrl": "http://localhost:3001",
  "blockBuilder.outputDir": "./generated",
  "blockBuilder.autoGenerate": true
}
```
