import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { existsSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const DEFAULT_CANVAS = {
  name: 'My Project',
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  settings: {
    framework: 'react',
    apiFramework: 'hono',
    packageManager: 'pnpm',
  },
}

export const initCommand = new Command('init')
  .description('Initialize a canvas.json in the current directory')
  .option('-y, --yes', 'Skip prompts, use defaults')
  .action(async (opts) => {
    const outPath = resolve('canvas.json')

    if (existsSync(outPath) && !opts.yes) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'canvas.json already exists. Overwrite?',
        default: false,
      }])
      if (!overwrite) { console.log(chalk.gray('Cancelled.')); return }
    }

    let config = { ...DEFAULT_CANVAS }

    if (!opts.yes) {
      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Project name:', default: 'My Project' },
        { type: 'list', name: 'framework', message: 'Frontend framework:', choices: ['react', 'vue', 'svelte'], default: 'react' },
        { type: 'list', name: 'apiFramework', message: 'API framework:', choices: ['hono', 'nestjs', 'express', 'graphql', 'trpc'], default: 'hono' },
        { type: 'list', name: 'packageManager', message: 'Package manager:', choices: ['pnpm', 'npm', 'yarn'], default: 'pnpm' },
      ])
      config = {
        ...DEFAULT_CANVAS,
        name: answers.name,
        settings: {
          framework: answers.framework,
          apiFramework: answers.apiFramework,
          packageManager: answers.packageManager,
        },
      }
    }

    writeFileSync(outPath, JSON.stringify(config, null, 2))
    console.log()
    console.log(chalk.green('✅ Created canvas.json'))
    console.log()
    console.log(chalk.gray('Next steps:'))
    console.log(chalk.gray('  1. Open Block Builder at ') + chalk.white('http://localhost:3000'))
    console.log(chalk.gray('  2. Design your system and export canvas.json'))
    console.log(chalk.gray('  3. Run ') + chalk.white('bb generate') + chalk.gray(' to generate code'))
    console.log()
  })
