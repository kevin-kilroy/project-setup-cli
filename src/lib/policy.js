/**
 * Allowed repository infrastructure files that this tool can generate.
 *
 * This policy is used to keep the CLI focused on repository bootstrap,
 * rather than full application scaffolding.
 *
 * @type {string[]}
 */
export const allowedBootstrapPaths = [
    'README.md',
    '.gitignore',
    '.editorconfig',
    '.vscode/extensions.json',
    '.devcontainer/devcontainer.json',
]
