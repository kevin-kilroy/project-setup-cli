import { runCommand } from "./exec.js";

/**
 * @typedef {Object} GithubRepoOptions
 * @property {string} projectPath
 * @property {string} projectName
 * @property {'public' | 'private'} githubVisibility
 * @property {string} githubDescription
 */

/**
 * Creates a GitHub repository from the local project using the gh CLI.
 *
 * @param {GithubRepoOptions} options
 * @returns {Promise<void>}
 */
export async function createGithubRepo({
  projectPath,
  projectName,
  githubVisibility,
  githubDescription,
}) {
  await runCommand("gh", ["auth", "status"], { cwd: projectPath });

  const args = [
    "repo",
    "create",
    projectName,
    "--source",
    ".",
    "--remote",
    "origin",
    githubVisibility === "public" ? "--public" : "--private",
  ];

  if (githubDescription) {
    args.push("--description", githubDescription);
  }

  await runCommand("gh", args, { cwd: projectPath });
}
