
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
var path=require("path");
var webpack = require("webpack");

var plugins = [];
var app = [
    //'./app.js',
    //'whatwg-fetch',
];

const with_samples = process.env.samples || false;

/*
plugins.push( new CopyWebpackPlugin({
    patterns: [
    { from:"../samples", to:"./samples" },
  ]
}));
*/

plugins.push( new MiniCssExtractPlugin({
  filename: 'assets/css/ui.css', // 输出的CSS文件名称和路径设置，例如app.css等。可以根据需要自定义。
}));

if( with_samples ) {
  plugins.push(  new HtmlWebpackPlugin(
    {
      filename: './index.html',
      template: '../samples/index.html',
      publicPath: '../',
      inject: false,
    }
  ));
  app.push( './app.withsamples.js' );
} else {
  app.push( './app.js' );
}


console.log(with_samples);


const devServerHost = '127.0.0.1';
const devServerPort = 8083;

module.exports = {
  "entry": {
    app : app,
  },
  "output": {
    path: path.resolve( __dirname, '../dist' ),
    filename: 'libq.js',
    publicPath: '/',
  },
  "module": {
    rules: [
      {
        test: /\.scss$/,
        use: [ 
          MiniCssExtractPlugin.loader, 
          { 
          loader: 'sass-loader' 
          }
        ] 
      },
      {
        test: /\.css$/,
        use: [
          //'extract-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ]
      },
      {
        test: /\.tag$/,
        use: [ './loaders/tagloader2.js' ]
      },
      {
        test: /\.view$/,
        use: [ './loaders/viewloader2.js' ]
      },
      {
        test: /\.page$/,
        use: [ './loaders/pageloader2.js' ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 1024*1024,
            outputPath: 'assets/fonts/',
          }
        }
      },
      {
			  test:/\.(png|jpg|gif|jpeg)/, //是匹配图片文件后缀名
			  use:[{
        		loader:'url-loader', //指定使用的loader和loader的配置参数
        		options:{
            		limit:5*1024,  //是把小于5KB的文件打成Base64的格式，写入JS
            		outputPath: path.resolve( __dirname, 'images')  //打包后的图片放到img文件夹下
            	}
        }]
      }
    ]
  },
  resolve: {
    extensions: [".js"]
  },

  plugins: plugins,

  devServer : {
    static : path.resolve( __dirname, '../dist'),
    //contentBase: path.resolve( __dirname, '../dist'),
    //contentBase: path.join(__dirname, ''),
    compress: true,
    host: devServerHost,
    port: devServerPort,
    hot: true,
    headers: {'Access-Control-Allow-Origin': '*' },
  },
  stats : {
    errorDetails: true
  },
}
