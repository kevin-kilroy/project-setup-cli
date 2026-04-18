import { access, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { runCommand } from './exec.js'
import { allowedBootstrapPaths } from './policy.js'

/**
 * @typedef {Object} CleanupPlan
 * @property {string} projectPath
 * @property {string[]} existingPaths
 * @property {string[]} missingPaths
 */

/**
 * @typedef {Object} CleanupOptions
 * @property {boolean} [dryRun]
 * @property {boolean} [includeGit]
 */

/**
 * @typedef {Object} CleanupResult
 * @property {CleanupPlan} plan
 * @property {string[]} deletedPaths
 * @property {Array<{ path: string, message: string }>} failures
 * @property {boolean} gitRemoteRemoved
 */

/**
 * Checks whether a path exists.
 *
 * @param {string} targetPath
 * @returns {Promise<boolean>}
 */
async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

/**
 * Attempts to remove a directory only when it is empty.
 *
 * @param {string} directoryPath
 * @returns {Promise<void>}
 */
async function removeDirIfEmpty(directoryPath) {
    try {
        const entries = await readdir(directoryPath)
        if (entries.length === 0) {
            await rm(directoryPath, { recursive: false, force: false })
        }
    } catch {
        // Best-effort cleanup only.
    }
}

/**
 * Builds a cleanup plan by checking which generated files currently exist.
 *
 * @param {string} projectPath
 * @returns {Promise<CleanupPlan>}
 */
export async function getCleanupPlan(projectPath) {
    const existingPaths = []
    const missingPaths = []

    for (const relativePath of allowedBootstrapPaths) {
        const absolutePath = path.join(projectPath, relativePath)
        if (await pathExists(absolutePath)) {
            existingPaths.push(relativePath)
        } else {
            missingPaths.push(relativePath)
        }
    }

    return {
        projectPath,
        existingPaths,
        missingPaths,
    }
}

/**
 * Removes generated repository artifacts according to policy allowlist.
 *
 * @param {string} projectPath
 * @param {CleanupOptions} [options={}]
 * @returns {Promise<CleanupResult>}
 */
export async function cleanupProjectArtifacts(projectPath, options = {}) {
    const dryRun = options.dryRun === true
    const includeGit = options.includeGit === true

    const plan = await getCleanupPlan(projectPath)
    const deletedPaths = []
    const failures = []
    let gitRemoteRemoved = false

    if (!dryRun) {
        for (const relativePath of plan.existingPaths) {
            const absolutePath = path.join(projectPath, relativePath)
            try {
                await rm(absolutePath, { force: true })
                deletedPaths.push(relativePath)
            } catch (error) {
                failures.push({
                    path: relativePath,
                    message: error instanceof Error ? error.message : String(error),
                })
            }
        }

        await removeDirIfEmpty(path.join(projectPath, '.vscode'))
        await removeDirIfEmpty(path.join(projectPath, '.devcontainer'))

        if (includeGit) {
            try {
                await runCommand('git', ['remote', 'remove', 'origin'], {
                    cwd: projectPath,
                })
                gitRemoteRemoved = true
            } catch {
                gitRemoteRemoved = false
            }
        }
    }

    return {
        plan,
        deletedPaths,
        failures,
        gitRemoteRemoved,
    }
}
