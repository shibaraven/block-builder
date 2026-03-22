import { Command } from 'commander'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { resolve } from 'path'
import { existsSync } from 'fs'

export const watchCommand = new Command('watch')
  .alias('w')
  .description('Watch canvas.json and regenerate on change')
  .argument('[input]', 'Canvas JSON file', 'canvas.json')
  .option('-o, --output <dir>', 'Output directory', './generated')
  .action(async (input: string, opts) => {
    const inputPath = resolve(input)
    if (!existsSync(inputPath)) {
      console.error(chalk.red(`\n❌ File not found: ${inputPath}\n`))
      process.exit(1)
    }

    console.log(chalk.bold('\n👀 Watching ') + chalk.white(input) + chalk.bold(' for changes...\n'))
    console.log(chalk.gray('  Press Ctrl+C to stop\n'))

    const { execaCommand } = await import('execa').catch(() => ({ execaCommand: null }))

    const runGenerate = async () => {
      const { generateCommand } = await import('./generate')
      // Re-run generate
      process.stdout.write(chalk.gray(`[${new Date().toLocaleTimeString()}] Regenerating...\r`))
      try {
        // spawn self
        const { spawn } = await import('child_process')
        const child = spawn(process.execPath, [process.argv[1], 'generate', input, '-o', opts.output], {
          stdio: 'inherit',
        })
        child.on('close', (code) => {
          if (code === 0) console.log(chalk.green(`[${new Date().toLocaleTimeString()}] ✅ Regenerated successfully`))
        })
      } catch (e: any) {
        console.error(chalk.red('Generation failed: ' + e.message))
      }
    }

    await runGenerate()

    chokidar.watch(inputPath, { ignoreInitial: true })
      .on('change', runGenerate)
      .on('error', (err) => console.error(chalk.red('Watch error:'), err))
  })
