const path = require('node:path');
const baseConfig = require('./webpack.config.babel');

const port = 24011;
const publicPath = `http://localhost:${port}/`;

module.exports = {
  ...baseConfig,
  devtool: 'eval-source-map',
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
