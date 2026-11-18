import { defineConfig } from 'vite'
import type { WatcherOptions } from 'rollup'
import solidPlugin from 'vite-plugin-solid'

import tsconfigPaths from 'vite-tsconfig-paths'

// const CONFING = {
//     al: ['http://127.0.0.1:7700', 'app', 8700],
//     sl: ['http://127.0.0.1:7700', 'simple', 8707],
// }

let target = 'http://127.0.0.1:7700'
// let envt = process.env.target as keyof typeof CONFING
// if (envt && envt in CONFING) {
//     target = CONFING[envt]
// }

export default defineConfig(env => {
    let watch: WatcherOptions | null = null
    if (env.mode == 'development') {
        watch = { clearScreen: true }
    }

    return {
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern',
                    sourceMapIncludeSources: true,
                },
            },
            devSourcemap: true,
        },
        root: 'app',
        plugins: [tsconfigPaths(), solidPlugin({ hot: false })],
        server: {
            port: 8703,
            proxy: {
                '/api/': {
                    target: target,
                    changeOrigin: true,
                },
                '/record/': {
                    target: target,
                    changeOrigin: true,
                },
                '/simurgh-record/': {
                    target: target,
                    changeOrigin: true,
                },
            },
        },
        build: {
            manifest: true,
            sourcemap: true,
            target: 'esnext',
            outDir: 'dist',
            watch,
            assetsInlineLimit: 0,
            emptyOutDir: true,
            copyPublicDir: false,
            assetsDir: 'simurgh-assets',
            rollupOptions: {
                input: {
                    // index: 'index.html',
                    clean: 'app/html/clean.html',
                },
                output: { hashCharacters: 'hex' },
            },
        },
    }
})
