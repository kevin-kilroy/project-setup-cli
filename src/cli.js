import { Command } from "commander";
import { cleanupCommand } from "./commands/cleanup.js";
import { createCommand } from "./commands/create.js";

/**
 * Main commander program for project-init.
 *
 * Registers commands and global program metadata.
 * When no subcommand is provided, it runs the interactive create flow.
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
  .option("--include-git", "also remove local origin remote if present")
  .option("-y, --yes", "skip confirmation prompts")
  .action(cleanupCommand);

program.action(async () => {
  await createCommand(undefined, { interactive: true });
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
