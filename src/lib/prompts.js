import path from "node:path";
import inquirer from "inquirer";
import { defaults } from "../config/defaults.js";
import { devcontainerOptions } from "../config/devcontainers.js";
import { extensionChoices } from "../config/vscode-extensions.js";
import { printSummary, section } from "./output.js";

/**
 * @typedef {Object} PromptOptions
 * @property {boolean} [private]
 * @property {boolean} [public]
 * @property {boolean} [interactive]
 * @property {boolean} [devcontainer]
 * @property {boolean} [editorconfig]
 * @property {boolean} [vscode]
 * @property {boolean} [github]
 * @property {boolean} [skipGithub]
 * @property {boolean} [inPlace]
 * @property {boolean} [yes]
 * @property {string} [name]
 */

/**
 * @typedef {Object} FlagAnswers
 * @property {boolean | undefined} useCurrentDirectory
 * @property {boolean | undefined} initGit
 * @property {boolean | undefined} createGithub
 * @property {'public' | 'private' | undefined} githubVisibility
 * @property {boolean | undefined} pushInitialCommit
 * @property {boolean | undefined} addReadme
 * @property {boolean | undefined} addGitignore
 * @property {boolean | undefined} addEditorconfig
 * @property {boolean | undefined} addVscode
 * @property {string[] | undefined} recommendedExtensionIds
 * @property {boolean | undefined} addDevcontainer
 * @property {string | undefined} devcontainerId
 * @property {boolean | undefined} includeGithubCliInDevcontainer
 * @property {boolean | undefined} addDevcontainerExtensions
 * @property {string[] | undefined} devcontainerExtensionIds
 * @property {string | undefined} projectName
 */

/**
 * @typedef {Object} CollectedAnswers
 * @property {string} projectName
 * @property {string} parentDirectory
 * @property {boolean} useCurrentDirectory
 * @property {string} projectPath
 * @property {boolean} initGit
 * @property {boolean} createGithub
 * @property {'public' | 'private'} githubVisibility
 * @property {string} githubDescription
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
 * @property {boolean} confirmed
 */

/**
 * Validates incompatible command flags.
 *
 * @param {PromptOptions} options
 * @returns {void}
 */
function ensureNoConflicts(options) {
  if (options.public && options.private) {
    throw new Error("Use either --public or --private, not both.");
  }

  if (options.github && options.skipGithub) {
    throw new Error("Use either --github or --skip-github, not both.");
  }
}

/**
 * Resolves project name from argument or current directory when in-place mode is enabled.
 *
 * @param {string | undefined} name
 * @param {boolean} useCurrentDirectory
 * @param {string} cwd
 * @returns {string}
 */
function requiredProjectName(name, useCurrentDirectory, cwd) {
  if (name) {
    return name;
  }

  if (useCurrentDirectory) {
    return path.basename(cwd);
  }

  throw new Error("Project name is required unless --in-place is used.");
}

/**
 * Maps parsed commander options into partial answer values.
 *
 * @param {PromptOptions} options
 * @returns {FlagAnswers}
 */
function deriveFlagAnswers(options) {
  return {
    useCurrentDirectory: options.inPlace === true ? true : undefined,
    initGit: undefined,
    createGithub:
      options.github === true
        ? true
        : options.skipGithub === true
          ? false
          : undefined,
    githubVisibility: options.public
      ? "public"
      : options.private
        ? "private"
        : undefined,
    pushInitialCommit: undefined,
    addReadme: undefined,
    addGitignore: undefined,
    addEditorconfig: options.editorconfig === true ? true : undefined,
    addVscode: options.vscode === true ? true : undefined,
    recommendedExtensionIds: options.vscode
      ? defaults.recommendedExtensionIds
      : undefined,
    addDevcontainer: options.devcontainer === true ? true : undefined,
    devcontainerId: options.devcontainer ? defaults.devcontainerId : undefined,
    includeGithubCliInDevcontainer: options.devcontainer
      ? defaults.includeGithubCliInDevcontainer
      : undefined,
    addDevcontainerExtensions: options.devcontainer
      ? defaults.addDevcontainerExtensions
      : undefined,
    devcontainerExtensionIds: options.devcontainer
      ? defaults.devcontainerExtensionIds
      : undefined,
    projectName: options.name,
  };
}

/**
 * Applies configured defaults to gathered answers and computes project path.
 *
 * @param {Partial<CollectedAnswers> & { projectName: string, parentDirectory?: string }} answers
 * @param {string} cwd
 * @returns {CollectedAnswers}
 */
function withDefaults(answers, cwd) {
  const projectName = answers.projectName;
  const projectPath = answers.useCurrentDirectory
    ? cwd
    : path.resolve(answers.parentDirectory || cwd, projectName);
  const resolvedAddDevcontainerExtensions =
    answers.addDevcontainerExtensions ?? defaults.addDevcontainerExtensions;

  return {
    ...answers,
    projectPath,
    initGit: answers.initGit ?? defaults.initGit,
    createGithub: answers.createGithub ?? defaults.createGithub,
    githubVisibility: answers.githubVisibility ?? defaults.githubVisibility,
    githubDescription: answers.githubDescription ?? "",
    pushInitialCommit: answers.pushInitialCommit ?? defaults.pushInitialCommit,
    addReadme: answers.addReadme ?? defaults.addReadme,
    addGitignore: answers.addGitignore ?? defaults.addGitignore,
    addEditorconfig: answers.addEditorconfig ?? defaults.addEditorconfig,
    addVscode: answers.addVscode ?? defaults.addVscode,
    recommendedExtensionIds:
      answers.recommendedExtensionIds ?? defaults.recommendedExtensionIds,
    addDevcontainer: answers.addDevcontainer ?? defaults.addDevcontainer,
    devcontainerId: answers.devcontainerId ?? defaults.devcontainerId,
    includeGithubCliInDevcontainer:
      answers.includeGithubCliInDevcontainer ??
      defaults.includeGithubCliInDevcontainer,
    addDevcontainerExtensions: resolvedAddDevcontainerExtensions,
    devcontainerExtensionIds:
      answers.devcontainerExtensionIds ??
      (resolvedAddDevcontainerExtensions
        ? (answers.recommendedExtensionIds ?? defaults.recommendedExtensionIds)
        : []),
    useCurrentDirectory:
      answers.useCurrentDirectory ?? defaults.useCurrentDirectory,
  };
}

/**
 * Determines whether a prompt is required for a value.
 *
 * @param {unknown} flagValue
 * @param {boolean} interactiveMode
 * @returns {boolean}
 */
function requiresPrompt(flagValue, interactiveMode) {
  return interactiveMode || flagValue === undefined;
}

/**
 * Displays a yes/no question.
 *
 * @param {string} name
 * @param {string} message
 * @param {boolean} defaultValue
 * @returns {Promise<boolean>}
 */
async function askYesNo(name, message, defaultValue) {
  const response = await inquirer.prompt([
    {
      type: "confirm",
      name,
      message,
      default: defaultValue,
    },
  ]);
  return response[name];
}

/**
 * Displays an input question.
 *
 * @param {string} name
 * @param {string} message
 * @param {string} defaultValue
 * @param {boolean} [required=true]
 * @returns {Promise<string>}
 */
async function askInput(name, message, defaultValue, required = true) {
  const response = await inquirer.prompt([
    {
      type: "input",
      name,
      message,
      default: defaultValue,
      validate: (value) => {
        if (!required) {
          return true;
        }

        return value?.trim() ? true : "A value is required.";
      },
    },
  ]);
  return response[name];
}

/**
 * Displays a single-choice list question.
 *
 * @param {string} name
 * @param {string} message
 * @param {{ name: string, value: string }[]} choices
 * @param {string} defaultValue
 * @returns {Promise<string>}
 */
async function askSingleChoice(name, message, choices, defaultValue) {
  const response = await inquirer.prompt([
    {
      type: "list",
      name,
      message,
      choices,
      default: defaultValue,
    },
  ]);
  return response[name];
}

/**
 * Displays a multi-choice list question.
 *
 * @param {string} name
 * @param {string} message
 * @param {{ name: string, value: string }[]} choices
 * @param {string[]} defaultValue
 * @returns {Promise<string[]>}
 */
async function askMultiChoice(name, message, choices, defaultValue) {
  const response = await inquirer.prompt([
    {
      type: "checkbox",
      name,
      message,
      choices,
      default: defaultValue,
      loop: false,
    },
  ]);
  return response[name];
}

/**
 * Builds summary lines shown before final confirmation.
 *
 * @param {CollectedAnswers} answers
 * @returns {string[]}
 */
export function buildSummaryLines(answers) {
  const selectedDevcontainer = devcontainerOptions.find(
    (option) => option.id === answers.devcontainerId,
  );

  return [
    `Project path: ${answers.projectPath}`,
    `Git init: ${answers.initGit ? "yes" : "no"}`,
    `GitHub repo: ${answers.createGithub ? "yes" : "no"}`,
    `Visibility: ${answers.createGithub ? answers.githubVisibility : "n/a"}`,
    `Files: ${
      [
        answers.addReadme ? "README.md" : null,
        answers.addGitignore ? ".gitignore" : null,
        answers.addEditorconfig ? ".editorconfig" : null,
        answers.addVscode ? ".vscode/extensions.json" : null,
        answers.addDevcontainer ? ".devcontainer/devcontainer.json" : null,
      ]
        .filter(Boolean)
        .join(", ") || "none"
    }`,
    `Repo VS Code recommendations: ${answers.addVscode ? answers.recommendedExtensionIds.join(", ") || "none" : "n/a"}`,
    `Dev container base: ${answers.addDevcontainer ? selectedDevcontainer?.label || answers.devcontainerId : "no"}`,
    `Dev container extensions: ${answers.addDevcontainer ? (answers.addDevcontainerExtensions ? answers.devcontainerExtensionIds.join(", ") || "none" : "none") : "n/a"}`,
  ];
}

/**
 * Runs the interactive/non-interactive interview and returns normalized answers.
 *
 * @param {{ name?: string, options: PromptOptions, cwd?: string }} params
 * @returns {Promise<CollectedAnswers>}
 */
export async function collectAnswers({ name, options, cwd = process.cwd() }) {
  ensureNoConflicts(options);

  const interactiveMode = options.interactive === true || options.yes !== true;
  const flags = deriveFlagAnswers({ ...options, name });

  section("Step 1: Project basics");
  const useCurrentDirectory = requiresPrompt(
    flags.useCurrentDirectory,
    interactiveMode,
  )
    ? await askYesNo(
        "useCurrentDirectory",
        "Use the current directory as the project folder?",
        false,
      )
    : flags.useCurrentDirectory;

  const projectName = requiresPrompt(name, interactiveMode)
    ? await askInput(
        "projectName",
        "Project name:",
        useCurrentDirectory ? path.basename(cwd) : name || "",
      )
    : requiredProjectName(flags.projectName, useCurrentDirectory, cwd);

  const parentDirectory = useCurrentDirectory
    ? cwd
    : interactiveMode
      ? await askInput(
          "parentDirectory",
          "Where should the project folder be created?",
          cwd,
        )
      : cwd;

  const initGit = requiresPrompt(flags.initGit, interactiveMode)
    ? await askYesNo("initGit", "Initialize Git repository?", defaults.initGit)
    : flags.initGit;

  section("Step 2: GitHub");
  const createGithub = requiresPrompt(flags.createGithub, interactiveMode)
    ? await askYesNo(
        "createGithub",
        "Create a GitHub repository?",
        defaults.createGithub,
      )
    : flags.createGithub;

  const githubVisibility = createGithub
    ? requiresPrompt(flags.githubVisibility, interactiveMode)
      ? await askSingleChoice(
          "githubVisibility",
          "Repository visibility:",
          [
            { name: "Private", value: "private" },
            { name: "Public", value: "public" },
          ],
          defaults.githubVisibility,
        )
      : flags.githubVisibility
    : defaults.githubVisibility;

  const githubDescription = createGithub
    ? await askInput(
        "githubDescription",
        "Repository description (optional):",
        "",
        false,
      )
    : "";

  const pushInitialCommit =
    createGithub && initGit
      ? requiresPrompt(flags.pushInitialCommit, interactiveMode)
        ? await askYesNo(
            "pushInitialCommit",
            "Push initial commit now?",
            defaults.pushInitialCommit,
          )
        : flags.pushInitialCommit
      : false;

  section("Step 3: Repo-level files");
  const addReadme = requiresPrompt(flags.addReadme, interactiveMode)
    ? await askYesNo(
        "addReadme",
        "Add a minimal README.md?",
        defaults.addReadme,
      )
    : flags.addReadme;
  const addGitignore = requiresPrompt(flags.addGitignore, interactiveMode)
    ? await askYesNo("addGitignore", "Add a .gitignore?", defaults.addGitignore)
    : flags.addGitignore;
  const addEditorconfig = requiresPrompt(flags.addEditorconfig, interactiveMode)
    ? await askYesNo(
        "addEditorconfig",
        "Add a .editorconfig?",
        defaults.addEditorconfig,
      )
    : flags.addEditorconfig;

  section("Step 4: Editor support");
  const addVscode = requiresPrompt(flags.addVscode, interactiveMode)
    ? await askYesNo(
        "addVscode",
        "Add VS Code recommendations?",
        defaults.addVscode,
      )
    : flags.addVscode;

  const recommendedExtensionIds = addVscode
    ? requiresPrompt(flags.recommendedExtensionIds, interactiveMode)
      ? await askMultiChoice(
          "recommendedExtensionIds",
          "Choose recommended VS Code extensions for this repo:",
          extensionChoices,
          defaults.recommendedExtensionIds,
        )
      : flags.recommendedExtensionIds
    : [];

  section("Step 5: Dev container");
  const addDevcontainer = requiresPrompt(flags.addDevcontainer, interactiveMode)
    ? await askYesNo(
        "addDevcontainer",
        "Add a dev container?",
        defaults.addDevcontainer,
      )
    : flags.addDevcontainer;

  const devcontainerId = addDevcontainer
    ? requiresPrompt(flags.devcontainerId, interactiveMode)
      ? await askSingleChoice(
          "devcontainerId",
          "Choose base image/template:",
          devcontainerOptions.map((option) => ({
            name: `${option.label} - ${option.description}`,
            value: option.id,
          })),
          defaults.devcontainerId,
        )
      : flags.devcontainerId
    : defaults.devcontainerId;

  const includeGithubCliInDevcontainer = addDevcontainer
    ? requiresPrompt(flags.includeGithubCliInDevcontainer, interactiveMode)
      ? await askYesNo(
          "includeGithubCliInDevcontainer",
          "Include GitHub CLI in the dev container?",
          defaults.includeGithubCliInDevcontainer,
        )
      : flags.includeGithubCliInDevcontainer
    : false;

  const addDevcontainerExtensions = addDevcontainer
    ? requiresPrompt(flags.addDevcontainerExtensions, interactiveMode)
      ? await askYesNo(
          "addDevcontainerExtensions",
          "Add VS Code extensions to the dev container?",
          defaults.addDevcontainerExtensions,
        )
      : flags.addDevcontainerExtensions
    : false;

  const devcontainerExtensionIds =
    addDevcontainer && addDevcontainerExtensions
      ? await askMultiChoice(
          "devcontainerExtensionIds",
          "Choose VS Code extensions for the dev container:",
          extensionChoices,
          addVscode
            ? recommendedExtensionIds
            : defaults.devcontainerExtensionIds,
        )
      : [];

  const merged = withDefaults(
    {
      projectName,
      parentDirectory,
      useCurrentDirectory,
      initGit,
      createGithub,
      githubVisibility,
      githubDescription,
      pushInitialCommit,
      addReadme,
      addGitignore,
      addEditorconfig,
      addVscode,
      recommendedExtensionIds,
      addDevcontainer,
      devcontainerId,
      includeGithubCliInDevcontainer,
      addDevcontainerExtensions,
      devcontainerExtensionIds,
    },
    cwd,
  );

  section("Step 6: Confirmation");
  printSummary(buildSummaryLines(merged));
  const confirmed = await askYesNo("confirmed", "Proceed?", false);

  return {
    ...merged,
    confirmed,
  };
}
