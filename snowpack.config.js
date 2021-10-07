// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/#configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  "mount": {
    "src": "/lib"
  },
  // plugins: [],
  // installOptions: {},
  // devOptions: {},
  buildOptions: {
    baseUrl: './src'
  },
};
