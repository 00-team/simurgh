import { UserConfig, defineConfig } from 'vite'
import type { WatcherOptions } from 'rollup'
import solidPlugin from 'vite-plugin-solid'
import { resolve } from 'path'

let target = 'https://simurgh.00-team.org'
if (process.env.local_api_target) {
    target = 'http://127.0.0.1:7700'
}

console.log('api target: ' + target)

export default defineConfig(env => {
    let other: Partial<UserConfig> = {}
    if (env.command == 'build') {
        other.base = '/static/app/'
    }

    let watch: WatcherOptions | null = null
    if (env.mode == 'development') {
        watch = {
            clearScreen: true,
        }
    }

    return {
        ...other,
        plugins: [solidPlugin({ hot: false })],
        server: {
            port: 8700,
            proxy: {
                '/api/': {
                    target,
                    changeOrigin: true,
                },
                '/records/': {
                    target,
                    changeOrigin: true,
                },
            },
        },
        build: {
            target: 'esnext',
            outDir: 'static/app/',
            watch,
            rollupOptions: {},
        },
        resolve: {
            alias: { '!': resolve(__dirname, '../app') },
        },
    }
})
