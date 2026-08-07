// Shared across frontend-shell/react-app/next-app - see
// @szczypkaweb/shared-ui's src/postcss-preset.cjs for the actual config,
// which prevents this 4-line plugin config from drifting between apps the
// same way globals.css already does for design tokens.
module.exports = require('@szczypkaweb/shared-ui/postcss.config');
