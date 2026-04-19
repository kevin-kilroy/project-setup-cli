import path from "node:path";
import inquirer from "inquirer";
import { cleanupProjectArtifacts, getCleanupPlan } from "../lib/cleanup.js";
import {
  error,
  note,
  printSummary,
  section,
  success,
  warn,
} from "../lib/output.js";

/**
 * @typedef {'generated' | 'contents' | 'directory'} CleanupMode
 */

/**
 * @typedef {Object} CleanupCommandOptions
 * @property {boolean} [dryRun]
 * @property {boolean} [yes]
 * @property {boolean} [includeGit]
 * @property {boolean} [allFiles]
 * @property {boolean} [deleteDirectory]
 */

/**
 * Resolves cleanup mode from parsed options.
 *
 * @param {CleanupCommandOptions} options
 * @returns {CleanupMode}
 */
function resolveCleanupMode(options) {
  if (options.allFiles && options.deleteDirectory) {
    throw new Error("Use either --all-files or --delete-directory, not both.");
  }

  if (options.deleteDirectory) {
    return "directory";
  }

  if (options.allFiles) {
    return "contents";
  }

  return "generated";
}

/**
 * Prompts for cleanup confirmation.
 *
 * @param {string} projectPath
 * @param {boolean} inPlace
 * @param {CleanupMode} mode
 * @returns {Promise<boolean>}
 */
async function confirmCleanup(projectPath, inPlace, mode) {
  const promptMessage =
    mode === "directory"
      ? `Delete directory ${projectPath} and all contents?`
      : mode === "contents"
        ? inPlace
          ? "You are deleting all files in the current directory. Continue?"
          : `Delete all files in ${projectPath} while keeping the directory?`
        : inPlace
          ? "You are cleaning generated files in the current directory. Continue?"
          : `Delete generated files in ${projectPath}?`;

  const proceedResponse = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: promptMessage,
      default: false,
    },
  ]);

  if (!proceedResponse.proceed) {
    return false;
  }

  if (!inPlace) {
    return true;
  }

  const guardResponse = await inquirer.prompt([
    {
      type: "input",
      name: "guard",
      message:
        mode === "contents"
          ? "Type CLEANUP to confirm deleting all files in-place:"
          : "Type CLEANUP to confirm in-place cleanup:",
      validate: (value) =>
        value === "CLEANUP" ? true : "Type CLEANUP to continue.",
    },
  ]);

  return guardResponse.guard === "CLEANUP";
}

/**
 * Runs cleanup command to remove generated artifacts for test/reset workflows.
 *
 * @param {string | undefined} targetPath
 * @param {CleanupCommandOptions} options
 * @returns {Promise<void>}
 */
export async function cleanupCommand(targetPath, options) {
  const projectPath = path.resolve(targetPath || process.cwd());
  const inPlace = projectPath === process.cwd();
  const cleanupMode = resolveCleanupMode(options);
  const dryRun = options.dryRun === true;
  const includeGit = options.includeGit === true;
  const skipPrompts = options.yes === true;

  if (cleanupMode === "directory" && inPlace) {
    throw new Error(
      "Refusing to delete the current working directory. Choose a different path.",
    );
  }

  section("Cleanup");
  const plan = await getCleanupPlan(projectPath);
  const modeLabel =
    cleanupMode === "directory"
      ? "delete directory"
      : cleanupMode === "contents"
        ? "delete all files in directory"
        : "delete generated bootstrap files only";

  printSummary([
    `Project path: ${projectPath}`,
    `Cleanup mode: ${modeLabel}`,
    `Existing generated files: ${plan.existingPaths.length}`,
    `Files to delete: ${plan.existingPaths.length ? plan.existingPaths.join(", ") : "none"}`,
    `Include git remote cleanup: ${includeGit ? "yes" : "no"}`,
    `Dry run: ${dryRun ? "yes" : "no"}`,
  ]);

  if (
    cleanupMode === "generated" &&
    !plan.existingPaths.length &&
    !includeGit
  ) {
    note("Nothing to clean up.");
    return;
  }

  if (dryRun) {
    warn("Dry run complete. No files were deleted.");
    return;
  }

  if (!skipPrompts) {
    const confirmed = await confirmCleanup(projectPath, inPlace, cleanupMode);
    if (!confirmed) {
      note("Cleanup cancelled.");
      return;
    }
  }

  const result = await cleanupProjectArtifacts(projectPath, {
    dryRun: false,
    includeGit,
    cleanupMode,
  });

  if (result.deletedPaths.length) {
    success(`Deleted ${result.deletedPaths.length} generated file(s).`);
  } else {
    note("No generated files were deleted.");
  }

  if (includeGit && cleanupMode === "generated") {
    if (result.gitRemoteRemoved) {
      success("Removed git origin remote.");
    } else {
      note("Git origin remote was not removed (not found or git unavailable).");
    }

    note("Remote GitHub repositories are never deleted automatically.");
  }

  if (result.failures.length) {
    for (const failure of result.failures) {
      error(`Failed to delete ${failure.path}: ${failure.message}`);
    }
    throw new Error("Cleanup completed with errors.");
  }

  success("Cleanup done.");
}
