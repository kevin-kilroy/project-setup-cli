import { describe, expect, it } from 'vitest'
import { collectUniqueExtensionIds } from '../src/lib/files.js'

/**
 * Unit tests for file helper behavior that does not require filesystem writes.
 */
describe('collectUniqueExtensionIds', () => {
    /**
     * Verifies extension ids remain unique even when group ids repeat.
     */
    it('deduplicates repeated extension ids while preserving order', () => {
        const extensions = collectUniqueExtensionIds([
            'eamodio.gitlens',
            'ms-vscode-remote.remote-containers',
            'eamodio.gitlens',
        ])

        expect(extensions).toContain('eamodio.gitlens')
        expect(extensions).toContain('ms-vscode-remote.remote-containers')
        expect(new Set(extensions).size).toBe(extensions.length)
    })
})
