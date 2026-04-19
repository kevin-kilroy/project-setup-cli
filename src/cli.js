import { Command } from "commander";
import inquirer from "inquirer";
import { cleanupCommand } from "./commands/cleanup.js";
import { createCommand } from "./commands/create.js";

/**
 * @typedef {'create' | 'cleanup'} RootAction
 */

/**
 * Prompts for the root action when no subcommand is provided.
 *
 * @returns {Promise<RootAction>}
 */
async function askRootAction() {
  const response = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "Create a new project", value: "create" },
        { name: "Remove a project", value: "cleanup" },
      ],
    },
  ]);

  return response.action;
}

/**
 * Collects interactive options for cleanup and maps them to cleanup command flags.
 *
 * @returns {Promise<{ targetPath: string, options: { dryRun: boolean, includeGit: boolean, allFiles: boolean, deleteDirectory: boolean, yes: boolean } }>}
 */
async function askCleanupOptions() {
  const targetPathResponse = await inquirer.prompt([
    {
      type: "input",
      name: "targetPath",
      message: "Project path to clean:",
      default: process.cwd(),
      validate: (value) =>
        value?.trim() ? true : "A project path is required.",
    },
  ]);
  const targetPath = targetPathResponse.targetPath.trim();

  const scopeResponse = await inquirer.prompt([
    {
      type: "list",
      name: "cleanupScope",
      message: "How should cleanup delete files?",
      choices: [
        {
          name: "Remove all files in the directory (keep the directory)",
          value: "all-files",
        },
        {
          name: "Delete the directory itself (and everything in it)",
          value: "delete-directory",
        },
      ],
      default: "all-files",
    },
  ]);

  const promptOptions = await inquirer.prompt([
    {
      type: "confirm",
      name: "dryRun",
      message: "Preview cleanup only (dry run)?",
      default: false,
    },
    {
      type: "confirm",
      name: "yes",
      message: "Skip confirmation prompts?",
      default: false,
    },
  ]);

  const options = {
    ...promptOptions,
    includeGit: false,
    allFiles: scopeResponse.cleanupScope === "all-files",
    deleteDirectory: scopeResponse.cleanupScope === "delete-directory",
  };

  return {
    targetPath,
    options,
  };
}

/**
 * Main commander program for project-init.
 *
 * Registers commands and global program metadata.
 * When no subcommand is provided, it prompts for create vs cleanup.
 */
const program = new Command();

program
  .name("project-init")
  .description(
    "Bootstrap a repository with optional GitHub and dev container setup",
  )
  .version("0.1.0");

program
  .command("create")
  .argument("[name]", "project name")
  .option("--private", "create a private GitHub repo")
  .option("--public", "create a public GitHub repo")
  .option("--interactive", "always prompt for values")
  .option("--devcontainer", "add a dev container")
  .option("--editorconfig", "add an .editorconfig file")
  .option("--vscode", "add VS Code recommendations")
  .option("--github", "create a GitHub repository with gh")
  .option("--skip-github", "skip GitHub repository creation")
  .option("--in-place", "use the current directory as the project folder")
  .option("-y, --yes", "accept defaults for missing decisions")
  .action(createCommand);

program
  .command("cleanup")
  .argument("[path]", "project path to clean (default: current directory)")
  .option("--dry-run", "preview generated files that would be deleted")
  .option(
    "--all-files",
    "delete all files and folders in target directory but keep the directory",
  )
  .option("--delete-directory", "delete target directory and all contents")
  .option("--include-git", "also remove local origin remote if present")
  .option("-y, --yes", "skip confirmation prompts")
  .action(cleanupCommand);

program.action(async () => {
  const action = await askRootAction();

  if (action === "create") {
    await createCommand(undefined, { interactive: true });
    return;
  }

  const cleanupAnswers = await askCleanupOptions();
  await cleanupCommand(cleanupAnswers.targetPath, cleanupAnswers.options);
});

program.parseAsync(process.argv).catch(
  /**
   * @param {unknown} error
   */
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  },
);
