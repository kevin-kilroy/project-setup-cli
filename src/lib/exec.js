import { spawn } from "node:child_process";

/**
 * @typedef {Object} RunCommandOptions
 * @property {string | undefined} [cwd] Working directory for the spawned process.
 */

/**
 * @typedef {Object} RunCommandResult
 * @property {string} stdout Trimmed stdout output.
 * @property {string} stderr Trimmed stderr output.
 * @property {number | null} code Process exit code.
 */

/**
 * Runs a subprocess command and captures output.
 *
 * @param {string} command Executable to run.
 * @param {string[]} [args=[]] Command arguments.
 * @param {RunCommandOptions} [options={}] Execution options.
 * @returns {Promise<RunCommandResult>}
 */
export async function runCommand(command, args = [], options = {}) {
  const { cwd } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on(
      "data",
      /**
       * @param {Buffer | string} chunk
       */
      (chunk) => {
        stdout += chunk.toString();
      },
    );

    child.stderr.on(
      "data",
      /**
       * @param {Buffer | string} chunk
       */
      (chunk) => {
        stderr += chunk.toString();
      },
    );

    child.on(
      "error",
      /**
       * @param {Error} error
       */
      (error) => {
        reject(error);
      },
    );

    child.on(
      "close",
      /**
       * @param {number | null} code
       */
      (code) => {
        if (code === 0) {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
          return;
        }

        /** @type {Error & { code?: number | null }} */
        const failure = new Error(
          `Command failed (${command} ${args.join(" ")}): ${stderr.trim() || stdout.trim()}`,
        );
        failure.code = code;
        reject(failure);
      },
    );
  });
}
