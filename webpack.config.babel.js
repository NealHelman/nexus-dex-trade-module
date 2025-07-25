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
          },
        },
      },
      {
        test: /\.css$/,              // <--- Add this rule
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    alias: webpackAliases,
  },
};
