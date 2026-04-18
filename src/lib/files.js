import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { templateDefaults } from '../config/defaults.js'
import { devcontainerOptions } from '../config/devcontainers.js'
import { extensionGroups } from '../config/vscode-extensions.js'

/**
 * @typedef {Object} FileAnswers
 * @property {string} projectPath
 * @property {string} projectName
 * @property {boolean} useCurrentDirectory
 * @property {boolean} addReadme
 * @property {boolean} addGitignore
 * @property {boolean} addEditorconfig
 * @property {boolean} addVscode
 * @property {boolean} addDevcontainer
 * @property {string[]} extensionGroupIds
 * @property {string} devcontainerId
 * @property {boolean} includeGithubCliInDevcontainer
 * @property {boolean} includeEditorExtensionsInDevcontainer
 */

/**
 * Expands extension group ids into a unique extension recommendation list.
 *
 * @param {string[]} groupIds
 * @returns {string[]}
 */
export function collectExtensionIds(groupIds) {
    const selectedGroups = extensionGroups.filter((group) => groupIds.includes(group.id))
    return [...new Set(selectedGroups.flatMap((group) => group.extensions))]
}

/**
 * Renders README template with project name substitution.
 *
 * @param {string} projectName
 * @returns {string}
 */
function renderReadme(projectName) {
    return templateDefaults.readme.replace('{{PROJECT_NAME}}', projectName)
}

/**
 * Builds devcontainer JSON content from user selections.
 *
 * @param {FileAnswers} answers
 * @param {string[]} extensionIds
 * @returns {{
 *   name: string,
 *   image: string,
 *   features: Record<string, object>,
 *   customizations: Record<string, unknown>
 * }}
 */
function buildDevcontainerConfig(answers, extensionIds) {
    const option = devcontainerOptions.find((candidate) => candidate.id === answers.devcontainerId)
    if (!option) {
        throw new Error(`Unknown dev container id: ${answers.devcontainerId}`)
    }

    const features = {}
    if (answers.includeGithubCliInDevcontainer) {
        features['ghcr.io/devcontainers/features/github-cli:1'] = {}
    }

    const customizations = {}
    if (answers.includeEditorExtensionsInDevcontainer) {
        customizations.vscode = { extensions: extensionIds }
    }

    return {
        name: `${answers.projectName} dev container`,
        image: option.image,
        features,
        customizations,
    }
}

/**
 * Ensures target directory is safe to write into.
 *
 * @param {string} projectPath
 * @param {boolean} allowExisting
 * @returns {Promise<void>}
 */
async function assertNonEmptyDirectoryAllowed(projectPath, allowExisting) {
    if (allowExisting) {
        return
    }

    try {
        const entries = await readdir(projectPath)
        if (entries.length > 0) {
            throw new Error(`Target directory already exists and is not empty: ${projectPath}`)
        }
    } catch (error) {
        if (error && error.code === 'ENOENT') {
            return
        }
        throw error
    }
}

/**
 * Creates selected repository infrastructure files.
 *
 * @param {FileAnswers} answers
 * @returns {Promise<void>}
 */
export async function createProjectFiles(answers) {
    await assertNonEmptyDirectoryAllowed(answers.projectPath, answers.useCurrentDirectory)
    await mkdir(answers.projectPath, { recursive: true })

    const extensionIds = collectExtensionIds(answers.extensionGroupIds)

    if (answers.addReadme) {
        await writeFile(
            path.join(answers.projectPath, 'README.md'),
            renderReadme(answers.projectName),
            'utf8',
        )
    }

    if (answers.addGitignore) {
        await writeFile(
            path.join(answers.projectPath, '.gitignore'),
            templateDefaults.gitignore,
            'utf8',
        )
    }

    if (answers.addEditorconfig) {
        await writeFile(
            path.join(answers.projectPath, '.editorconfig'),
            templateDefaults.editorconfig,
            'utf8',
        )
    }

    if (answers.addVscode) {
        const vscodeDir = path.join(answers.projectPath, '.vscode')
        await mkdir(vscodeDir, { recursive: true })
        const content = JSON.stringify({ recommendations: extensionIds }, null, 2)
        await writeFile(path.join(vscodeDir, 'extensions.json'), `${content}\n`, 'utf8')
    }

    if (answers.addDevcontainer) {
        const devcontainerDir = path.join(answers.projectPath, '.devcontainer')
        await mkdir(devcontainerDir, { recursive: true })
        const config = buildDevcontainerConfig(answers, extensionIds)
        await writeFile(
            path.join(devcontainerDir, 'devcontainer.json'),
            `${JSON.stringify(config, null, 2)}\n`,
            'utf8',
        )
    }
}
