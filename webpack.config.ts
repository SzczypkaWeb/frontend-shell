import 'dotenv/config';
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
    chunkFilename: '[name].[contenthash].js',
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // tsconfig.json's top-level `module` is CommonJS (required so
            // ts-node/webpack-cli can load *this* config file, which uses
            // CommonJS globals like __dirname). CommonJS output, however,
            // downlevels `import()` into a synchronous `require()` call
            // wrapped in an already-resolved Promise - which happens BEFORE
            // webpack's parser ever sees the code. Webpack's code-splitting
            // only recognizes the literal `import()` syntax, so a downleveled
            // dynamic import silently stops being split into its own chunk.
            //
            // That matters here because src/index.tsx uses `import('./bootstrap')`
            // specifically to create an async boundary: Module Federation needs
            // that boundary to initialize its shared scope (react/react-dom/
            // zustand) before any app code that consumes those shared singletons
            // runs. Without a real async chunk, react/react-dom/bootstrap/App all
            // get bundled into the synchronous main entry chunk together with
            // the `consume-shared` runtime module, which throws "Shared module
            // is not available for eager consumption" at runtime and leaves the
            // page blank.
            //
            // Overriding `module`/`moduleResolution` here (only for the app
            // source ts-loader compiles into the bundle, not for the config
            // file itself) keeps native ESM `import()` syntax intact so webpack
            // can actually split it off into an async chunk.
            compilerOptions: {
              module: 'ES2022',
              moduleResolution: 'Bundler',
            },
          },
        },
      },
      {
        test: /\.css$/i,
        // Order matters - webpack applies loaders right-to-left, so a class
        // like `flex` first goes through postcss-loader (Tailwind expands
        // it to real declarations, autoprefixer adds vendor prefixes), then
        // css-loader (resolves @import/url()), then style-loader (injects
        // the resulting CSS into the page via a <style> tag).
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'public/index.html') }),
    new webpack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL ?? 'http://localhost:3000'),
      // Explicit (rather than relying on webpack's `mode`-derived default) so
      // the auth mocks (see src/mocks) are reliably excluded from production
      // builds regardless of the `mode` setting below.
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
      'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN ?? ''),
    }),
    // Module Federation HOST config: consumes the 'reactApp' remote (react-app),
    // whose remoteEntry.js is served at http://localhost:8081 in dev. The remote is
    // resolved lazily at runtime (React.lazy + Suspense, see src/components/RemoteWidget.tsx)
    // rather than eagerly on host startup.
    //
    // The shell is also a container itself here (filename + exposes): it exposes
    // authStore so that react-app (or any other remote) can later add `shell` to its
    // own `remotes` config and `import { useAuthStore } from 'shell/authStore'` to read
    // the exact same auth state, instead of each app tracking login state separately.
    new ModuleFederationPlugin({
      name: 'shell',
      filename: 'remoteEntry.js',
      remotes: {
        reactApp: 'reactApp@http://localhost:8081/remoteEntry.js',
      },
      exposes: {
        './authStore': './src/store/authStore.ts',
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
        // Singleton so the exposed authStore (a Zustand store, i.e. module-level
        // state) resolves to one instance across the federation boundary - two
        // copies of zustand would mean two independent stores instead of one
        // shared source of truth for the logged-in user.
        zustand: {
          singleton: true,
          requiredVersion: packageJson.dependencies.zustand,
        },
      },
    }),
  ],
  devServer: {
    port: 8080,
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    // Allows navigating directly to /login (see src/AppShell.tsx, which has no
    // router yet and switches on window.location.pathname) instead of 404ing -
    // any unmatched path falls back to index.html, same as with a client-side router.
    historyApiFallback: true,
  },
};

export default config;
