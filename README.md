# project-setup-cli

Bootstrap a repository with optional GitHub and dev container setup.

This CLI is intentionally a repository bootstrap tool, not an application scaffold generator. It creates repository infrastructure only and avoids assumptions about source layout or frameworks.

## Features

- Create a project directory or initialize in the current directory.
- Optionally initialize Git and create an initial commit.
- Optionally create a GitHub repository using gh.
- Optionally add repository files:
  - README.md
  - .gitignore
  - .editorconfig
  - .vscode/extensions.json
  - .devcontainer/devcontainer.json
- Interactive guided flow with a confirmation step.
- Cleanup command for removing generated bootstrap artifacts during testing.
- Config-driven catalogs for dev container bases and VS Code extension groups.

## Requirements

- Node.js 20 or newer
- git (for Git initialization/commits)
- gh (only needed when creating GitHub repositories)

## Quick Start

```bash
npm install
npm run start
```

Or use the linked command directly:

```bash
npm link
project-init
```

You can still run the explicit create command:

```bash
project-init create my-repo --interactive
```

## Install

```bash
npm install
```

For local CLI usage as a command:

```bash
npm link
```

## Usage

Start the interactive wizard (no inputs required):

```bash
project-init
```

Equivalent during local development:

```bash
npm run start
```

Show help:

```bash
project-init --help
```

Create command:

```bash
project-init create [name] [options]
```

Cleanup command:

```bash
project-init cleanup [path] [options]
```

Examples:

```bash
# Fully interactive from root command
project-init

# Non-interactive defaults for missing values
project-init create my-repo --yes

# Use current directory as project folder
project-init create --in-place --yes

# Request GitHub + VS Code recommendations + dev container
project-init create my-repo --github --vscode --devcontainer --interactive

# Preview cleanup for current directory
project-init cleanup --dry-run

# Cleanup generated artifacts in a target path
project-init cleanup ./my-repo

# Cleanup without prompts and remove local origin remote too
project-init cleanup ./my-repo --include-git --yes
```

## Command Options

These apply to the explicit create command:

- project-init create [name] [options]

- --private: create a private GitHub repository
- --public: create a public GitHub repository
- --interactive: always prompt for values
- --devcontainer: add a dev container
- --editorconfig: add an .editorconfig file
- --vscode: add VS Code recommendations
- --github: create a GitHub repository with gh
- --skip-github: skip GitHub repository creation
- --in-place: use the current directory as the project folder
- -y, --yes: accept defaults for missing decisions

These apply to cleanup:

- project-init cleanup [path] [options]

- --dry-run: preview what would be deleted without removing files
- --include-git: also remove local origin remote if present
- -y, --yes: skip confirmation prompts

## Interactive Flow

The create command walks through:

1. Project basics
2. GitHub options
3. Repo-level files
4. Editor support
5. Dev container
6. Confirmation summary

## Defaults

Current defaults are defined in src/config/defaults.js:

- Initialize Git: yes
- Create GitHub repository: no
- GitHub visibility: private
- Push initial commit: no
- Add README.md: yes
- Add .gitignore: yes
- Add .editorconfig: no
- Add VS Code recommendations: no
- Default extension groups: general
- Add dev container: no
- Default dev container base: base-ubuntu
- Include GitHub CLI in dev container: yes
- Include selected editor extensions in dev container customizations: yes

## Config Catalogs

Dev container options in src/config/devcontainers.js:

- base-ubuntu
- javascript-node
- python

VS Code extension groups in src/config/vscode-extensions.js:

- general
- containers
- javascript
- python

## Generated Files

The tool can generate only repository infrastructure files:

- README.md
- .gitignore
- .editorconfig
- .vscode/extensions.json
- .devcontainer/devcontainer.json

It does not generate application structure such as src directories, test directories, framework files, or language manifests.

Cleanup removes only these generated files and will not delete your project directory or .git folder.

## Scripts

- npm run start: run CLI entrypoint
- npm run lint: Biome checks
- npm run format: format with Biome
- npm run format:check: verify formatting
- npm run test: run Vitest
- npm run check: lint + format check + test

## Project Structure

```text
project-init/
	package.json
	biome.json
	bin/
		project-init.js
	src/
		cli.js
		commands/
			create.js
		lib/
			prompts.js
			exec.js
			files.js
			git.js
			github.js
			output.js
			policy.js
		config/
			devcontainers.js
			vscode-extensions.js
			defaults.js
	tests/
		files.test.js
```

## Documentation and Comments

This project keeps user-facing docs and JSDoc comments aligned with behavior changes.

- Update this README whenever command entrypoints, flags, defaults, or flow steps change.
- Update JSDoc in source files when function parameters, return values, or side effects change.
