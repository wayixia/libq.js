
var path=require("path");
var webpack = require("webpack");


const main = [
    './app.js',
    //'whatwg-fetch',
    //'./ui.libq'
];

module.exports = {
  "entry": {
    main
  },
  "output": {
    path: __dirname + '/',
    filename: 'app.bundle.js'
  },
  "module": {
    rules: [
     {
       test: /\.scss$/,
       use: ['style-loader','css-loader', 'sass-loader']
     },
     {
       test: /\.view$/,
       use: [ './viewloader2.js' ]
     }
    ]
  },
  resolve: {
    extensions: [".libq", ".ts", ".js"]
  },

}
