/**
 * ...bundling vgraph for vpower
 */

var fs = require('fs');
var ver = JSON.parse(fs.readFileSync('./package.json')).version;
var env = process.env.NODE_ENV
var webpack = require('webpack');
var min = '';

plugins = [
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurenceOrderPlugin() ];

if (env === 'prod') {
  min = `min.`
  plugins.push(new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }));
}

module.exports = {
  entry: './vgraph.js',
  module: {
    loaders: [{
      test: /\.js$/,
      loader: "babel-loader",
      query: {
        presets: ['es2015']
      }
    }],
  },
  output: {
    filename: `./dist/vgraph-${ver}.${min}js`,
    library: 'vGraph',
    libraryTarget: "var"
  },
  plugins: plugins,
  externals: {
    'd3': 'd3',
    'jquery': 'jQuery',
    'angular': 'angular',
    'es6-promise': 'ES6Promise'
  }
}
