import { createProjectFiles } from '../lib/files.js'
import { commitInitialFiles, initGitRepo, pushInitialCommit } from '../lib/git.js'
import { createGithubRepo } from '../lib/github.js'
import { error, note, section, success, warn } from '../lib/output.js'
import { collectAnswers } from '../lib/prompts.js'

/**
 * Orchestrates repository bootstrap from parsed CLI arguments.
 *
 * @param {string | undefined} name Project name argument from commander.
 * @param {Record<string, unknown>} options Parsed command options.
 * @returns {Promise<void>}
 */
export async function createCommand(name, options) {
    section('Repository bootstrap')

    const answers = await collectAnswers({ name, options })

    if (!answers.confirmed) {
        note('Cancelled.')
        return
    }

    await createProjectFiles(answers)
    success(`Prepared repository files in ${answers.projectPath}`)

    if (answers.initGit) {
        await initGitRepo(answers.projectPath)
        const committed = await commitInitialFiles(answers.projectPath)
        if (committed) {
            success('Initialized Git and created initial commit.')
        } else {
            warn('Git initialized; no changes were available to commit.')
        }
    } else {
        note('Skipped git initialization.')
    }

    if (answers.createGithub) {
        try {
            await createGithubRepo(answers)
            success('Created GitHub repository and configured origin remote.')

            if (answers.pushInitialCommit && answers.initGit) {
                await pushInitialCommit(answers.projectPath)
                success('Pushed initial commit to origin.')
            } else {
                note('Skipped pushing initial commit.')
            }
        } catch (failure) {
            error(failure instanceof Error ? failure.message : String(failure))
            throw failure
        }
    } else {
        note('Skipped GitHub repository creation.')
    }

    success('Done.')
}
