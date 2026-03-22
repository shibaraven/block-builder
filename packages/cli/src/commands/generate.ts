import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { readFileSync, existsSync } from 'fs'
import { outputFile, ensureDir } from 'fs-extra'
import { join, resolve } from 'path'
import { generateFromCanvas } from '@block-builder/codegen'
import type { ProjectSettings } from '@block-builder/types'

export const generateCommand = new Command('generate')
  .alias('g')
  .description('Generate TypeScript code from a canvas JSON file')
  .argument('[input]', 'Canvas JSON file path', 'canvas.json')
  .option('-o, --output <dir>', 'Output directory', './generated')
  .option('-f, --framework <fw>', 'Frontend framework: react | vue', 'react')
  .option('-a, --api <api>', 'API framework: hono | nestjs | express | graphql | trpc', 'hono')
  .option('-p, --pm <pm>', 'Package manager: pnpm | npm | yarn', 'pnpm')
  .option('--no-tests', 'Skip test file generation')
  .option('--no-docker', 'Skip Docker file generation')
  .action(async (input: string, opts) => {
    const inputPath = resolve(input)

    if (!existsSync(inputPath)) {
      console.error(chalk.red(`\n❌ File not found: ${inputPath}`))
      console.log(chalk.gray(`   Run ${chalk.white('bb init')} to create a canvas.json\n`))
      process.exit(1)
    }

    const spinner = ora('Reading canvas...').start()

    try {
      const raw = readFileSync(inputPath, 'utf-8')
      const canvas = JSON.parse(raw)

      if (!canvas.nodes || !Array.isArray(canvas.nodes)) {
        spinner.fail('Invalid canvas.json — missing "nodes" array')
        process.exit(1)
      }

      spinner.text = `Generating code for ${canvas.nodes.length} blocks...`

      const settings: ProjectSettings = {
        framework: opts.framework,
        apiFramework: opts.api,
        packageManager: opts.pm,
      }

      const result = await generateFromCanvas(
        { nodes: canvas.nodes, edges: canvas.edges ?? [], viewport: { x: 0, y: 0, zoom: 1 } },
        settings,
        canvas.name ?? 'Project'
      )

      spinner.text = `Writing ${result.files.length} files...`

      const outDir = resolve(opts.output)
      await ensureDir(outDir)

      let written = 0
      for (const file of result.files) {
        const skip =
          (!opts.tests && file.category === 'test') ||
          (!opts.docker && (file.path === 'Dockerfile' || file.path === 'docker-compose.yml'))
        if (skip) continue
        await outputFile(join(outDir, file.path), file.content, 'utf-8')
        written++
      }

      spinner.succeed(chalk.green(`Generated ${written} files in ${chalk.white(opts.output)}`))

      console.log()
      console.log(chalk.bold('Summary:'))
      if (result.summary.types.length)      console.log(chalk.gray('  TypeScript types:'), result.summary.types.join(', '))
      if (result.summary.endpoints.length)  console.log(chalk.gray('  API endpoints:  '), result.summary.endpoints.join(', '))
      if (result.summary.hooks.length)      console.log(chalk.gray('  React hooks:    '), result.summary.hooks.join(', '))
      if (result.summary.components.length) console.log(chalk.gray('  UI components:  '), result.summary.components.join(', '))
      console.log()
      console.log(chalk.gray(`  Total files: ${written}`))
      console.log()
    } catch (e: any) {
      spinner.fail(chalk.red('Generation failed: ' + e.message))
      process.exit(1)
    }
  })
