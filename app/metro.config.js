const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web loads a WebAssembly build (wa-sqlite.wasm); Metro needs
// to know how to bundle .wasm as an asset for that to work in the browser.
config.resolver.assetExts.push('wasm');

module.exports = config;
