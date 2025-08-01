const path = require('node:path');
const baseConfig = require('./webpack.config.babel');

console.log('=== DEV WEBPACK CONFIG LOADED ===');
console.log('Base config module rules:', baseConfig.module?.rules?.length);

const port = 24011;
const publicPath = `http://localhost:${port}/`;

module.exports = {
  ...baseConfig,
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              ['@babel/preset-env', { targets: require('nexus-module/lib/browserslistQuery').default }],
              ['@babel/preset-react', { development: process.env.NODE_ENV !== 'production', runtime: 'automatic' }],
              ['@babel/preset-typescript', { 
                allowNamespaces: true,
                allowDeclareFields: true
              }],
            ],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },
  devServer: {
    port,
    devMiddleware: {
      publicPath,
    },
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        ignored: ['**/storage.json'],  // <-- ignore storage.json
      },
    },
    compress: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    static: {
      directory: path.join(process.cwd(), 'dist'),
      watch: true,
    },
  },
};
