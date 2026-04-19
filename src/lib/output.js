import chalk from "chalk";

/**
 * Prints a section heading in cyan.
 *
 * @param {string} title
 */
export function section(title) {
  console.log(chalk.cyan(`\n${title}`));
}

/**
 * Prints a success message in green.
 *
 * @param {string} message
 */
export function success(message) {
  console.log(chalk.green(message));
}

/**
 * Prints a warning or summary message in yellow.
 *
 * @param {string} message
 */
export function warn(message) {
  console.log(chalk.yellow(message));
}

/**
 * Prints an error message in red.
 *
 * @param {string} message
 */
export function error(message) {
  console.error(chalk.red(message));
}

/**
 * Prints a secondary note in gray.
 *
 * @param {string} message
 */
export function note(message) {
  console.log(chalk.gray(message));
}

/**
 * Prints a formatted summary block.
 *
 * @param {string[]} lines Summary lines to display.
 */
export function printSummary(lines) {
  section("Summary");
  for (const line of lines) {
    console.log(chalk.yellow(line));
  }
}
