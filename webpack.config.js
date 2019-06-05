/**
 * ...bundling vgraph for vpower
 */

var webpack = require("webpack");

module.exports = {
  entry: "./vgraph.js",
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        query: {
          presets: ["es2015"]
        }
      }
    ]
  },
  output: {
    filename: "./dist/vgraph.module.js",
    library: "vGraph",
    libraryTarget: process.env.BUILD_TARGET || 'global'
  },
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin()
    // new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ],
  externals: {
    d3: "d3",
    jquery: "jQuery",
    angular: "angular",
    "es6-promise": "ES6Promise"
  }
};
