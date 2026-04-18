export const defaults = {
  initGit: true,
  createGithub: false,
  githubVisibility: "private",
  pushInitialCommit: false,
  addReadme: true,
  addGitignore: true,
  addEditorconfig: false,
  addVscode: false,
  extensionGroupIds: ["general"],
  addDevcontainer: false,
  devcontainerId: "base-ubuntu",
  includeGithubCliInDevcontainer: true,
  includeEditorExtensionsInDevcontainer: true,
  useCurrentDirectory: false,
};

export const templateDefaults = {
  readme:
    "# {{PROJECT_NAME}}\n\nRepository bootstrap created with project-init.\n",
  gitignore:
    "# System\n.DS_Store\n\n# Logs\n*.log\n\n# Environment\n.env\n.env.*\n\n# Node\nnode_modules/\n",
  editorconfig:
    "root = true\n\n[*]\ncharset = utf-8\nend_of_line = lf\ninsert_final_newline = true\nindent_style = space\nindent_size = 2\ntrim_trailing_whitespace = true\n",
};
