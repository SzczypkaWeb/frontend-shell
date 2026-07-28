import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import packageJson from './package.json';

interface FullConfiguration extends Configuration {
  devServer?: DevServerConfiguration;
}

const { ModuleFederationPlugin } = webpack.container;

const config: FullConfiguration = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    // Required by Module Federation so the shell (and any consumer of it) resolves
    // chunk/asset URLs correctly regardless of where it's hosted.
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [{ test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'public/index.html') }),
    new webpack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL ?? 'http://localhost:3000'),
    }),
    // Module Federation HOST config: consumes the 'reactApp' remote (react-app),
    // whose remoteEntry.js is served at http://localhost:8081 in dev. The remote is
    // resolved lazily at runtime (React.lazy + Suspense, see src/components/RemoteWidget.tsx)
    // rather than eagerly on host startup.
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        reactApp: 'reactApp@http://localhost:8081/remoteEntry.js',
      },
      shared: {
        // Singleton must match react-app's shared config exactly — otherwise the host
        // and the remote each load their own copy of React, which crashes at runtime
        // with a "duplicate React instances" / invalid hook call error.
        react: {
          singleton: true,
          requiredVersion: packageJson.dependencies.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: packageJson.dependencies['react-dom'],
        },
      },
    }),
  ],
  devServer: {
    port: 8080,
    open: true,
  },
};

export default config;
