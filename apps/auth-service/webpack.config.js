const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const path = require('node:path');

module.exports = {
  output: {
    path: path.join(__dirname, '../../dist/apps/auth-service'),
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [
        './src/assets',
        {
          glob: '*.proto',
          input: '../../libs/proto/src',
          output: '.',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
  ],
};
