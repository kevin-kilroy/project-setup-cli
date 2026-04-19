import { runCommand } from "./exec.js";

/**
 * Initializes a git repository in the target directory.
 *
 * @param {string} projectPath
 * @returns {Promise<void>}
 */
export async function initGitRepo(projectPath) {
  await runCommand("git", ["init"], { cwd: projectPath });
}

/**
 * Stages all files and creates the initial commit when there are changes.
 *
 * @param {string} projectPath
 * @returns {Promise<boolean>} True when a commit is created, false when there is nothing to commit.
 */
export async function commitInitialFiles(projectPath) {
  await runCommand("git", ["add", "."], { cwd: projectPath });

  const status = await runCommand("git", ["status", "--porcelain"], {
    cwd: projectPath,
  });
  if (!status.stdout) {
    return false;
  }

  await runCommand(
    "git",
    ["commit", "-m", "chore: initial repository bootstrap"],
    {
      cwd: projectPath,
    },
  );

  return true;
}

/**
 * Pushes the current HEAD to origin and sets upstream.
 *
 * @param {string} projectPath
 * @returns {Promise<void>}
 */
export async function pushInitialCommit(projectPath) {
  await runCommand("git", ["push", "-u", "origin", "HEAD"], {
    cwd: projectPath,
  });
}
