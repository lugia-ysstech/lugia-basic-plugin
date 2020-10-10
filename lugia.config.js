import { join } from 'path';
import tsImportPluginFactory from 'ts-import-plugin';
export default {
  disableCSSModules: true,
  cssModulesWithAffix: true,
  entry: './src/index.tsx',
  publicPath: '/',
  alias: {
    '@': join(__dirname, './src'),
  },
  extraBabelIncludes: [/decamelize/],
  extraBabelPlugins: [
    [
      'import',
      {
        libraryName: '@lugia/lugia-web',
        libraryDirectory: 'dist',
      },
      '@lugia/lugia-web',
    ]
  ],

  applyWebpack(webpackConfig, ) {
    webpackConfig.module.rules.push({
      test: /\.(tsx|ts)$/,
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        getCustomTransformers: () => ({
          before: [
            tsImportPluginFactory([
              {
                libraryName: '@lugia/lugia-web',
                libraryDirectory: 'dist',
              }
            ]),
          ],
        }),
        compilerOptions: {
          module: 'es2015',
        },
      },
      exclude: /node_modules/,
    });
    return webpackConfig;
  },
  dllDependenciesExcludes: ['@lugia/lugia-web', 'rc-util'],
};
