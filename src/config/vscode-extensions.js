/**
 * @typedef {Object} ExtensionGroup
 * @property {string} id
 * @property {string} label
 * @property {string[]} extensions
 */

/**
 * @typedef {Object} ExtensionChoice
 * @property {string} name
 * @property {string} value
 */

/**
 * Catalog of extension recommendation groups.
 *
 * @type {ExtensionGroup[]}
 */
export const extensionGroups = [
    {
        id: 'general',
        label: 'General development',
        extensions: ['eamodio.gitlens', 'editorconfig.editorconfig'],
    },
    {
        id: 'containers',
        label: 'Containers and Docker',
        extensions: ['ms-azuretools.vscode-docker', 'ms-vscode-remote.remote-containers'],
    },
    {
        id: 'javascript',
        label: 'JavaScript / TypeScript',
        extensions: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'],
    },
    {
        id: 'python',
        label: 'Python',
        extensions: ['ms-python.python', 'ms-python.vscode-pylance'],
    },
]

/**
 * Flattened extension choices for interactive multiselect prompts.
 *
 * @type {ExtensionChoice[]}
 */
export const extensionChoices = extensionGroups.flatMap((group) =>
    group.extensions.map((extensionId) => ({
        name: `${group.label}: ${extensionId}`,
        value: extensionId,
    })),
)
