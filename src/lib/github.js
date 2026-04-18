import { runCommand } from './exec.js'

export async function createGithubRepo({
    projectPath,
    projectName,
    githubVisibility,
    githubDescription,
}) {
    await runCommand('gh', ['auth', 'status'], { cwd: projectPath })

    const args = [
        'repo',
        'create',
        projectName,
        '--source',
        '.',
        '--remote',
        'origin',
        githubVisibility === 'public' ? '--public' : '--private',
    ]

    if (githubDescription) {
        args.push('--description', githubDescription)
    }

    await runCommand('gh', args, { cwd: projectPath })
}
