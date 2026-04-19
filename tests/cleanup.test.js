import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanupProjectArtifacts, getCleanupPlan } from '../src/lib/cleanup.js'

/** @type {string[]} */
const tempDirs = []

/**
 * Creates a temp directory for test repository fixtures.
 *
 * @returns {Promise<string>}
 */
async function createTempProjectDir() {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'project-init-cleanup-'))
    tempDirs.push(directory)
    return directory
}

afterEach(async () => {
    for (const directory of tempDirs.splice(0)) {
        await rm(directory, { recursive: true, force: true })
    }
})

describe('cleanup library', () => {
    it('collects existing and missing generated files in cleanup plan', async () => {
        const projectDir = await createTempProjectDir()
        await writeFile(path.join(projectDir, 'README.md'), '# temp\n', 'utf8')
        await mkdir(path.join(projectDir, '.vscode'), { recursive: true })
        await writeFile(
            path.join(projectDir, '.vscode', 'extensions.json'),
            '{"recommendations": []}\n',
            'utf8',
        )

        const plan = await getCleanupPlan(projectDir)

        expect(plan.existingPaths).toContain('README.md')
        expect(plan.existingPaths).toContain('.vscode/extensions.json')
        expect(plan.missingPaths).toContain('.gitignore')
    })

    it('deletes only generated artifacts and keeps unrelated files', async () => {
        const projectDir = await createTempProjectDir()
        await writeFile(path.join(projectDir, 'README.md'), '# temp\n', 'utf8')
        await writeFile(path.join(projectDir, '.gitignore'), 'node_modules/\n', 'utf8')
        await writeFile(path.join(projectDir, 'keep.txt'), 'persist\n', 'utf8')

        const result = await cleanupProjectArtifacts(projectDir)

        expect(result.deletedPaths).toContain('README.md')
        expect(result.deletedPaths).toContain('.gitignore')
        expect(result.failures).toHaveLength(0)

        const keepContents = await getCleanupPlan(projectDir)
        expect(keepContents.existingPaths).not.toContain('README.md')
        expect(keepContents.existingPaths).not.toContain('.gitignore')
    })

    it('supports dry-run without deleting files', async () => {
        const projectDir = await createTempProjectDir()
        await writeFile(path.join(projectDir, 'README.md'), '# temp\n', 'utf8')

        const result = await cleanupProjectArtifacts(projectDir, { dryRun: true })

        expect(result.deletedPaths).toHaveLength(0)
        expect(result.plan.existingPaths).toContain('README.md')

        const planAfter = await getCleanupPlan(projectDir)
        expect(planAfter.existingPaths).toContain('README.md')
    })

    it('deletes all directory contents when using contents mode', async () => {
        const projectDir = await createTempProjectDir()
        await writeFile(path.join(projectDir, 'README.md'), '# temp\n', 'utf8')
        await writeFile(path.join(projectDir, 'keep.txt'), 'temp\n', 'utf8')
        await mkdir(path.join(projectDir, 'nested'), { recursive: true })
        await writeFile(path.join(projectDir, 'nested', 'file.txt'), 'temp\n', 'utf8')

        const result = await cleanupProjectArtifacts(projectDir, {
            cleanupMode: 'contents',
        })

        expect(result.failures).toHaveLength(0)

        const entriesAfter = await getCleanupPlan(projectDir)
        expect(entriesAfter.existingPaths).toHaveLength(0)
    })

    it('deletes the target directory when using directory mode', async () => {
        const projectDir = await createTempProjectDir()
        await writeFile(path.join(projectDir, 'README.md'), '# temp\n', 'utf8')

        const result = await cleanupProjectArtifacts(projectDir, {
            cleanupMode: 'directory',
        })

        expect(result.failures).toHaveLength(0)
        expect(result.deletedPaths).toContain('.')
    })
})
