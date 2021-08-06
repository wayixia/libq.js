
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
    //path: 'D:/_web/wayixia.com/www.wayixia.com/themes/default/os/apps/wayixia/',
    filename: 'app.bundle.js',
    publicPath: '/',
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

  devServer : {
    contentBase: path.join(__dirname, '/../../..'),
    //contentBase: path.join(__dirname, ''),
    compress: true,
    port: 8080,
    hot: true,
    headers: {'Access-Control-Allow-Origin': '*' },
  }
}
