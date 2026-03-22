#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import { generateCommand } from './commands/generate'
import { initCommand } from './commands/init'
import { watchCommand } from './commands/watch'
import { pullCommand } from './commands/pull'

const program = new Command()

program
  .name('block-builder')
  .description(chalk.bold('Block Builder CLI') + ' — generate TypeScript from canvas JSON')
  .version('1.0.0')

program.addCommand(initCommand)
program.addCommand(generateCommand)
program.addCommand(watchCommand)
program.addCommand(pullCommand)

program
  .command('*')
  .action(() => {
    console.log(chalk.red('\nUnknown command. Run `bb --help` for usage.\n'))
  })

program.parse()
