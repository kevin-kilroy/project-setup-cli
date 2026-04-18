import path from 'node:path'
import inquirer from 'inquirer'
import { cleanupProjectArtifacts, getCleanupPlan } from '../lib/cleanup.js'
import { error, note, printSummary, section, success, warn } from '../lib/output.js'

/**
 * @typedef {Object} CleanupCommandOptions
 * @property {boolean} [dryRun]
 * @property {boolean} [yes]
 * @property {boolean} [includeGit]
 */

/**
 * Prompts for cleanup confirmation.
 *
 * @param {string} projectPath
 * @param {boolean} inPlace
 * @returns {Promise<boolean>}
 */
async function confirmCleanup(projectPath, inPlace) {
    const promptMessage = inPlace
        ? 'You are cleaning the current directory. Continue?'
        : `Delete generated files in ${projectPath}?`

    const proceedResponse = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'proceed',
            message: promptMessage,
            default: false,
        },
    ])

    if (!proceedResponse.proceed) {
        return false
    }

    if (!inPlace) {
        return true
    }

    const guardResponse = await inquirer.prompt([
        {
            type: 'input',
            name: 'guard',
            message: 'Type CLEANUP to confirm in-place cleanup:',
            validate: (value) => (value === 'CLEANUP' ? true : 'Type CLEANUP to continue.'),
        },
    ])

    return guardResponse.guard === 'CLEANUP'
}

/**
 * Runs cleanup command to remove generated artifacts for test/reset workflows.
 *
 * @param {string | undefined} targetPath
 * @param {CleanupCommandOptions} options
 * @returns {Promise<void>}
 */
export async function cleanupCommand(targetPath, options) {
    const projectPath = path.resolve(targetPath || process.cwd())
    const inPlace = projectPath === process.cwd()
    const dryRun = options.dryRun === true
    const includeGit = options.includeGit === true
    const skipPrompts = options.yes === true

    section('Cleanup')
    const plan = await getCleanupPlan(projectPath)

    printSummary([
        `Project path: ${projectPath}`,
        `Existing generated files: ${plan.existingPaths.length}`,
        `Files to delete: ${plan.existingPaths.length ? plan.existingPaths.join(', ') : 'none'}`,
        `Include git remote cleanup: ${includeGit ? 'yes' : 'no'}`,
        `Dry run: ${dryRun ? 'yes' : 'no'}`,
    ])

    if (!plan.existingPaths.length && !includeGit) {
        note('Nothing to clean up.')
        return
    }

    if (dryRun) {
        warn('Dry run complete. No files were deleted.')
        return
    }

    if (!skipPrompts) {
        const confirmed = await confirmCleanup(projectPath, inPlace)
        if (!confirmed) {
            note('Cleanup cancelled.')
            return
        }
    }

    const result = await cleanupProjectArtifacts(projectPath, {
        dryRun: false,
        includeGit,
    })

    if (result.deletedPaths.length) {
        success(`Deleted ${result.deletedPaths.length} generated file(s).`)
    } else {
        note('No generated files were deleted.')
    }

    if (includeGit) {
        if (result.gitRemoteRemoved) {
            success('Removed git origin remote.')
        } else {
            note('Git origin remote was not removed (not found or git unavailable).')
        }

        note('Remote GitHub repositories are never deleted automatically.')
    }

    if (result.failures.length) {
        for (const failure of result.failures) {
            error(`Failed to delete ${failure.path}: ${failure.message}`)
        }
        throw new Error('Cleanup completed with errors.')
    }

    success('Cleanup done.')
}
