'use strict';

const path = require('path');
const rootPath = path.normalize(__dirname + '/../..');
const env = process.env.NODE_ENV || 'development';

var config = {

	development: {
		root: rootPath,
		app: {
			name: 'clicksite'
		},
		port: 3033,
		db: 'mongodb://localhost/clicksite-development'
		
	},

	test: {
		root: rootPath,
		app: {
			name: 'clicksite'
		},
		port: 3000,
		db: 'mongodb://localhost/clicksite-test'
		
	},

	production: {
		root: rootPath,
		app: {
			name: 'clicksite'
		},
		port: 3000,
		db: process.env.MONGODB_URI || 'mongodb://localhost/clicksite-production'

	}

};

module.exports = config[env];
