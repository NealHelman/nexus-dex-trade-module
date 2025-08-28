const path = require('node:path');
const webpackAliases = require('nexus-module/lib/webpackAliases').default;

module.exports = {
    mode: process.env.NODE_ENV,
    devtool: 'source-map',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: 'app.js',
    },
    target: 'web',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react',
                            '@babel/preset-typescript'
                        ],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.svg$/,
                use: ['@svgr/webpack'],
            },
            {
                test: /\.wasm$/,
                type: 'webassembly/async'
            }
        ],
    },
    resolve: {
        alias: webpackAliases,
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        fallback: {
            fs: false,
            path: false,
            os: false,
            crypto: false,
            stream: false,
            util: false,
        },
    },
    experiments: {
        asyncWebAssembly: true
    },
};
