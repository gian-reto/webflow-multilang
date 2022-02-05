const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const config = require("config");

/*-------------------------------------------------*/

module.exports = {
  // webpack optimization mode
  mode: process.env.NODE_ENV ? process.env.NODE_ENV : "development",

  // entry file(s)
  entry: "./src/index.js",

  // output file(s) and chunks
  output: {
    library: "WebflowMultilang",
    libraryTarget: "umd",
    globalObject: '(typeof self !== "undefined" ? self : this)',
    libraryExport: "default",
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    publicPath: config.get("publicPath"),
  },

  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: true })],
  },

  // module/loaders configuration
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
      },
    ],
  },

  plugins: [
    new HTMLWebpackPlugin({
      template: path.resolve(__dirname, "index.html"),
    }),
    new CopyPlugin({
      patterns: [{ from: "static", to: "public" }],
    }),
    // new BundleAnalyzerPlugin(),
  ],

  // development server configuration
  devServer: {
    // must be `true` for SPAs
    historyApiFallback: true,

    // open browser on server start
    open: config.get("open"),
  },

  // generate source map
  devtool:
    "production" === process.env.NODE_ENV
      ? false
      : "eval-cheap-module-source-map",
};
