import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeStoreZip } from './package-firefox.mjs';

describe('Firefox store zip', () => {
    it('stores nested entry names with forward slashes', async () => {
        const directory = await mkdtemp(path.join(os.tmpdir(), 'firefox-zip-'));
        const zipPath = path.join(os.tmpdir(), `firefox-zip-${Date.now()}.zip`);
        try {
            await mkdir(path.join(directory, 'assets'), { recursive: true });
            await writeFile(path.join(directory, 'assets', 'arc-ekeAq8Wa.js'), 'ok');

            await writeStoreZip(directory, zipPath);

            const archive = await readFile(zipPath);
            const names = archive.toString('latin1');
            expect(names).toContain('assets/arc-ekeAq8Wa.js');
            expect(names).not.toContain('assets\\arc-ekeAq8Wa.js');
        } finally {
            await rm(directory, { recursive: true, force: true });
            await rm(zipPath, { force: true });
        }
    });
});
