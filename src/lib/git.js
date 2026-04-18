import { runCommand } from './exec.js'

export async function initGitRepo(projectPath) {
    await runCommand('git', ['init'], { cwd: projectPath })
}

export async function commitInitialFiles(projectPath) {
    await runCommand('git', ['add', '.'], { cwd: projectPath })

    const status = await runCommand('git', ['status', '--porcelain'], {
        cwd: projectPath,
    })
    if (!status.stdout) {
        return false
    }

    await runCommand('git', ['commit', '-m', 'chore: initial repository bootstrap'], {
        cwd: projectPath,
    })

    return true
}

export async function pushInitialCommit(projectPath) {
    await runCommand('git', ['push', '-u', 'origin', 'HEAD'], {
        cwd: projectPath,
    })
}
