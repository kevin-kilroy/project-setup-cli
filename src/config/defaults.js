/**
 * @typedef {Object} BootstrapDefaults
 * @property {boolean} initGit
 * @property {boolean} createGithub
 * @property {'public' | 'private'} githubVisibility
 * @property {boolean} pushInitialCommit
 * @property {boolean} addReadme
 * @property {boolean} addGitignore
 * @property {boolean} addEditorconfig
 * @property {boolean} addVscode
 * @property {string[]} recommendedExtensionIds
 * @property {boolean} addDevcontainer
 * @property {string} devcontainerId
 * @property {boolean} includeGithubCliInDevcontainer
 * @property {boolean} addDevcontainerExtensions
 * @property {string[]} devcontainerExtensionIds
 * @property {boolean} useCurrentDirectory
 */

/**
 * @typedef {Object} TemplateDefaults
 * @property {string} readme
 * @property {string} gitignore
 * @property {string} editorconfig
 */

/**
 * Default answers for interactive and non-interactive bootstrap flow.
 *
 * @type {BootstrapDefaults}
 */
export const defaults = {
    initGit: true,
    createGithub: false,
    githubVisibility: 'private',
    pushInitialCommit: false,
    addReadme: true,
    addGitignore: true,
    addEditorconfig: false,
    addVscode: false,
    recommendedExtensionIds: ['eamodio.gitlens', 'editorconfig.editorconfig'],
    addDevcontainer: false,
    devcontainerId: 'base-ubuntu',
    includeGithubCliInDevcontainer: true,
    addDevcontainerExtensions: true,
    devcontainerExtensionIds: ['eamodio.gitlens', 'editorconfig.editorconfig'],
    useCurrentDirectory: false,
}

/**
 * Default file templates used by file generation helpers.
 *
 * @type {TemplateDefaults}
 */
export const templateDefaults = {
    readme: '# {{PROJECT_NAME}}\n\nRepository bootstrap created with project-init.\n',
    gitignore:
        '# System\n.DS_Store\n\n# Logs\n*.log\n\n# Environment\n.env\n.env.*\n\n# Node\nnode_modules/\n',
    editorconfig:
        'root = true\n\n[*]\ncharset = utf-8\nend_of_line = lf\ninsert_final_newline = true\nindent_style = space\nindent_size = 2\ntrim_trailing_whitespace = true\n',
}
