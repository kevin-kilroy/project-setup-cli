import { Command } from 'commander'
import { createCommand } from './commands/create.js'

/**
 * Main commander program for project-init.
 *
 * Registers commands and global program metadata.
 */
const program = new Command()

program
    .name('project-init')
    .description('Bootstrap a repository with optional GitHub and dev container setup')
    .version('0.1.0')

program
    .command('create')
    .argument('[name]', 'project name')
    .option('--private', 'create a private GitHub repo')
    .option('--public', 'create a public GitHub repo')
    .option('--interactive', 'always prompt for values')
    .option('--devcontainer', 'add a dev container')
    .option('--editorconfig', 'add an .editorconfig file')
    .option('--vscode', 'add VS Code recommendations')
    .option('--github', 'create a GitHub repository with gh')
    .option('--skip-github', 'skip GitHub repository creation')
    .option('--in-place', 'use the current directory as the project folder')
    .option('-y, --yes', 'accept defaults for missing decisions')
    .action(createCommand)

program.parseAsync(process.argv).catch(
    /**
     * @param {unknown} error
     */
    (error) => {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
    },
)
