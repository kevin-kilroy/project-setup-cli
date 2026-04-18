import chalk from 'chalk'

export function section(title) {
    console.log(chalk.cyan(`\n${title}`))
}

export function success(message) {
    console.log(chalk.green(message))
}

export function warn(message) {
    console.log(chalk.yellow(message))
}

export function error(message) {
    console.error(chalk.red(message))
}

export function note(message) {
    console.log(chalk.gray(message))
}

export function printSummary(lines) {
    section('Summary')
    for (const line of lines) {
        console.log(chalk.yellow(line))
    }
}
