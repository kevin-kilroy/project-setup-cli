import path from "node:path";
import inquirer from "inquirer";
import { defaults } from "../config/defaults.js";
import { devcontainerOptions } from "../config/devcontainers.js";
import { extensionGroups } from "../config/vscode-extensions.js";
import { section } from "./output.js";

function ensureNoConflicts(options) {
  if (options.public && options.private) {
    throw new Error("Use either --public or --private, not both.");
  }

  if (options.github && options.skipGithub) {
    throw new Error("Use either --github or --skip-github, not both.");
  }
}

function requiredProjectName(name, useCurrentDirectory, cwd) {
  if (name) {
    return name;
  }

  if (useCurrentDirectory) {
    return path.basename(cwd);
  }

  throw new Error("Project name is required unless --in-place is used.");
}

function deriveFlagAnswers(options, cwd) {
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
    extensionGroupIds: options.vscode ? defaults.extensionGroupIds : undefined,
    addDevcontainer: options.devcontainer === true ? true : undefined,
    devcontainerId: options.devcontainer ? defaults.devcontainerId : undefined,
    includeGithubCliInDevcontainer: options.devcontainer
      ? defaults.includeGithubCliInDevcontainer
      : undefined,
    includeEditorExtensionsInDevcontainer: options.devcontainer
      ? defaults.includeEditorExtensionsInDevcontainer
      : undefined,
    projectName: options.name,
  };
}

function withDefaults(answers, cwd) {
  const projectName = answers.projectName;
  const projectPath = answers.useCurrentDirectory
    ? cwd
    : path.resolve(answers.parentDirectory || cwd, projectName);

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
    extensionGroupIds: answers.extensionGroupIds ?? defaults.extensionGroupIds,
    addDevcontainer: answers.addDevcontainer ?? defaults.addDevcontainer,
    devcontainerId: answers.devcontainerId ?? defaults.devcontainerId,
    includeGithubCliInDevcontainer:
      answers.includeGithubCliInDevcontainer ??
      defaults.includeGithubCliInDevcontainer,
    includeEditorExtensionsInDevcontainer:
      answers.includeEditorExtensionsInDevcontainer ??
      defaults.includeEditorExtensionsInDevcontainer,
    useCurrentDirectory:
      answers.useCurrentDirectory ?? defaults.useCurrentDirectory,
  };
}

function requiresPrompt(flagValue, interactiveMode) {
  return interactiveMode || flagValue === undefined;
}

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

async function askMultiChoice(name, message, choices, defaultValue) {
  const response = await inquirer.prompt([
    {
      type: "checkbox",
      name,
      message,
      choices,
      default: defaultValue,
    },
  ]);
  return response[name];
}

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
    `Extension groups: ${answers.addVscode ? answers.extensionGroupIds.join(", ") || "none" : "n/a"}`,
    `Dev container base: ${answers.addDevcontainer ? selectedDevcontainer?.label || answers.devcontainerId : "no"}`,
  ];
}

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

  const extensionGroupIds = addVscode
    ? requiresPrompt(flags.extensionGroupIds, interactiveMode)
      ? await askMultiChoice(
          "extensionGroupIds",
          "Choose extension groups:",
          extensionGroups.map((group) => ({
            name: group.label,
            value: group.id,
          })),
          defaults.extensionGroupIds,
        )
      : flags.extensionGroupIds
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

  const includeEditorExtensionsInDevcontainer = addDevcontainer
    ? requiresPrompt(
        flags.includeEditorExtensionsInDevcontainer,
        interactiveMode,
      )
      ? await askYesNo(
          "includeEditorExtensionsInDevcontainer",
          "Include selected editor extensions in container customizations?",
          defaults.includeEditorExtensionsInDevcontainer,
        )
      : flags.includeEditorExtensionsInDevcontainer
    : false;

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
      extensionGroupIds,
      addDevcontainer,
      devcontainerId,
      includeGithubCliInDevcontainer,
      includeEditorExtensionsInDevcontainer,
    },
    cwd,
  );

  section("Step 6: Confirmation");
  const confirmed = await askYesNo("confirmed", "Proceed?", false);

  return {
    ...merged,
    confirmed,
  };
}
