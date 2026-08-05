/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This app's own components.
    './src/**/*.{ts,tsx}',
    // The compiled @szczypkaweb/shared-ui package: Tailwind only sees literal
    // class names, so classes used inside shared-ui's *source* are invisible
    // to it unless we also scan shared-ui's built output that this app
    // actually imports and renders.
    './node_modules/@szczypkaweb/shared-ui/dist/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
