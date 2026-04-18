import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { templateDefaults } from "../config/defaults.js";
import { devcontainerOptions } from "../config/devcontainers.js";
import { extensionGroups } from "../config/vscode-extensions.js";

export function collectExtensionIds(groupIds) {
  const selectedGroups = extensionGroups.filter((group) =>
    groupIds.includes(group.id),
  );
  return [...new Set(selectedGroups.flatMap((group) => group.extensions))];
}

function renderReadme(projectName) {
  return templateDefaults.readme.replace("{{PROJECT_NAME}}", projectName);
}

function buildDevcontainerConfig(answers, extensionIds) {
  const option = devcontainerOptions.find(
    (candidate) => candidate.id === answers.devcontainerId,
  );
  if (!option) {
    throw new Error(`Unknown dev container id: ${answers.devcontainerId}`);
  }

  const features = {};
  if (answers.includeGithubCliInDevcontainer) {
    features["ghcr.io/devcontainers/features/github-cli:1"] = {};
  }

  const customizations = {};
  if (answers.includeEditorExtensionsInDevcontainer) {
    customizations.vscode = { extensions: extensionIds };
  }

  return {
    name: `${answers.projectName} dev container`,
    image: option.image,
    features,
    customizations,
  };
}

async function assertNonEmptyDirectoryAllowed(projectPath, allowExisting) {
  if (allowExisting) {
    return;
  }

  try {
    const entries = await readdir(projectPath);
    if (entries.length > 0) {
      throw new Error(
        `Target directory already exists and is not empty: ${projectPath}`,
      );
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

export async function createProjectFiles(answers) {
  await assertNonEmptyDirectoryAllowed(
    answers.projectPath,
    answers.useCurrentDirectory,
  );
  await mkdir(answers.projectPath, { recursive: true });

  const extensionIds = collectExtensionIds(answers.extensionGroupIds);

  if (answers.addReadme) {
    await writeFile(
      path.join(answers.projectPath, "README.md"),
      renderReadme(answers.projectName),
      "utf8",
    );
  }

  if (answers.addGitignore) {
    await writeFile(
      path.join(answers.projectPath, ".gitignore"),
      templateDefaults.gitignore,
      "utf8",
    );
  }

  if (answers.addEditorconfig) {
    await writeFile(
      path.join(answers.projectPath, ".editorconfig"),
      templateDefaults.editorconfig,
      "utf8",
    );
  }

  if (answers.addVscode) {
    const vscodeDir = path.join(answers.projectPath, ".vscode");
    await mkdir(vscodeDir, { recursive: true });
    const content = JSON.stringify({ recommendations: extensionIds }, null, 2);
    await writeFile(
      path.join(vscodeDir, "extensions.json"),
      `${content}\n`,
      "utf8",
    );
  }

  if (answers.addDevcontainer) {
    const devcontainerDir = path.join(answers.projectPath, ".devcontainer");
    await mkdir(devcontainerDir, { recursive: true });
    const config = buildDevcontainerConfig(answers, extensionIds);
    await writeFile(
      path.join(devcontainerDir, "devcontainer.json"),
      `${JSON.stringify(config, null, 2)}\n`,
      "utf8",
    );
  }
}
