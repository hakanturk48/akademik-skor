const appJson = require('./app.json');

const basePath = String(process.env.EXPO_BASE_URL || '')
  .trim()
  .replace(/^\/+|\/+$/g, '');

module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...appJson.expo.experiments,
    ...(basePath ? { baseUrl: `/${basePath}` } : {}),
  },
});
