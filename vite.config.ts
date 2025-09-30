import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './src/manifest.json';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        crx({ manifest: manifest as any })
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                sidepanel: resolve(__dirname, 'src/sidepanel/index.html')
            }
        }
    },
    test: {
        globals: true,
        environment: 'jsdom'
    }
});