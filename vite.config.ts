import { defineConfig } from 'vite'
import type { WatcherOptions } from 'rollup'
import solidPlugin from 'vite-plugin-solid'

import tsconfigPaths from 'vite-tsconfig-paths'

const CONFING = {
    al: ['http://127.0.0.1:7700', 'app', 8700],
    sl: ['http://127.0.0.1:7700', 'simple', 8707],
} as const

let target = CONFING.al
if (process.env.target && CONFING[process.env.target]) {
    target = CONFING[process.env.target]
}

console.log('target: ' + target[1])

export default defineConfig(env => {
    let watch: WatcherOptions | null = null
    if (env.mode == 'development') {
        watch = {
            clearScreen: true,
        }
    }

    return {
        root: target[1],
        plugins: [tsconfigPaths(), solidPlugin({ hot: false })],
        server: {
            port: target[2],
            proxy: {
                '/api/': {
                    target: target[0],
                    changeOrigin: true,
                },
                '/simurgh-record/': {
                    target: target[0],
                    changeOrigin: true,
                },
                '/record/': {
                    target: target[0],
                    changeOrigin: true,
                },
            },
        },
        build: {
            target: 'esnext',
            outDir: 'static/dist',
            watch,
            assetsInlineLimit: 0,
            emptyOutDir: true,
            copyPublicDir: false,
        },
    }
})
