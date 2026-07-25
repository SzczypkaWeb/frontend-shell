import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

interface FullConfiguration extends Configuration {
  devServer?: DevServerConfiguration;
}

const config: FullConfiguration = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.tsx'),        // punkt wejścia
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,                                            // czyści dist przed każdym buildem
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],                     // bez tego import './App' (bez rozszerzenia) nie zadziała
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'public/index.html') }),
  ],
  devServer: {
    port: 8080,
    open: true,
  },
};

export default config;