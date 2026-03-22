import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

export const pullCommand = new Command('pull')
  .description('Pull a project from Block Builder server and save as canvas.json')
  .argument('<project-id-or-share-token>', 'Project ID or share token')
  .option('-s, --server <url>', 'Server URL', 'http://localhost:3001')
  .option('-o, --output <file>', 'Output file', 'canvas.json')
  .option('-t, --token <jwt>', 'Auth token (for private projects)')
  .action(async (id: string, opts) => {
    const spinner = ora(`Fetching project ${id}...`).start()

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`

      // Try share token first, then project ID
      let res = await fetch(`${opts.server}/api/projects/share/${id}`, { headers })
      if (!res.ok) res = await fetch(`${opts.server}/api/projects/${id}`, { headers })

      if (!res.ok) {
        spinner.fail(`Failed to fetch project: ${res.status} ${res.statusText}`)
        process.exit(1)
      }

      const data = await res.json() as any
      const project = data.data

      const canvas = {
        name: project.name,
        ...project.canvas,
        settings: project.settings,
      }

      const outPath = resolve(opts.output)
      writeFileSync(outPath, JSON.stringify(canvas, null, 2))
      spinner.succeed(chalk.green(`Saved to ${opts.output}`))
      console.log(chalk.gray(`  Project: ${project.name}`))
      console.log(chalk.gray(`  Blocks: ${project.canvas?.nodes?.length ?? 0}`))
      console.log()
      console.log(chalk.gray('Run ') + chalk.white('bb generate') + chalk.gray(' to generate code'))
      console.log()
    } catch (e: any) {
      spinner.fail('Pull failed: ' + e.message)
      process.exit(1)
    }
  })
