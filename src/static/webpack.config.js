/*
	This configuration is for making a library out of everything that is in the /static/app dir

	Webpack config options:
		https://github.com/webpack/docs/wiki/configuration
*/

var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'dist/');
var APP_DIR = path.resolve(__dirname, 'app');

var config = {
	entry: [APP_DIR + '/index.jsx'],

	devtool: 'source-map',

	output: {
		path: BUILD_DIR,
		publicPath: '/static/dist/',
		filename: 'motu-app.js',
		library: 'motu',
		libraryTarget: 'umd'
	},

	resolve: { extensions: ['', '.js', '.jsx'] },

	module : {
		loaders : [
			{
				test : /\.jsx?/,
				include : APP_DIR,
				loader : 'babel',
				exclude: /node_modules/
			}
		]
	},

	externals: {
        // Use external version of React
        "react": "React",
        "react-dom": "ReactDOM"
    }
};

module.exports = config;