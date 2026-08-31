import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(appRoot, '../..');
const legalArtifacts = [
  ['LICENSE', 'LICENSE.txt'],
  ['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md'],
  ['apps/workbench-lab/src/assets/fonts/LICENSE-Geist.txt', 'licenses/Geist-OFL.txt'],
  ['apps/workbench-lab/src/assets/fonts/LICENSE-Newsreader.txt', 'licenses/Newsreader-OFL.txt']
] as const;

function copyLegalArtifacts(): Plugin {
  return {
    name: 'copy-legal-artifacts',
    apply: 'build',
    async closeBundle() {
      const dist = path.join(appRoot, 'dist');
      await mkdir(path.join(dist, 'licenses'), { recursive: true });
      await Promise.all(legalArtifacts.map(([source, output]) =>
        copyFile(path.join(repositoryRoot, source), path.join(dist, output))
      ));
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [svelte(), copyLegalArtifacts()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
