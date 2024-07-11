import { readdirSync } from 'fs'
import { resolve } from 'path'

const DIR = resolve('./ssr/script')

let entry = {}
readdirSync(DIR)
    .filter(f => f.endsWith('.ts'))
    .forEach(i => {
        let e = i.substring(0, i.lastIndexOf('.'))
        entry[e] = resolve(DIR, i)
    })

const Config = {
    mode: 'production',
    entry,
    output: {
        path: resolve('./static/ssr/script'),
        clean: true,
        filename: '[name].js',
        sourceMapFilename: 'source_maps/[file].map',
        assetModuleFilename: 'assets/[hash][ext][query]',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
        ],
    },
    devtool: 'source-map',
    plugins: [],
    resolve: {
        extensions: ['.mjs', '.tsx', '.ts', '.js'],
        plugins: [],
    },
    optimization: {
        emitOnErrors: false,
        chunkIds: 'deterministic',
        minimize: true,
    },
}

export default Config
