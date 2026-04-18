import { spawn } from 'node:child_process'

export async function runCommand(command, args = [], options = {}) {
    const { cwd } = options

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
        })

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
        })

        child.on('error', (error) => {
            reject(error)
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code })
                return
            }

            const failure = new Error(
                `Command failed (${command} ${args.join(' ')}): ${stderr.trim() || stdout.trim()}`,
            )
            failure.code = code
            reject(failure)
        })
    })
}
