const express = require('express');
const config = require('./lib/config');
const glob = require('glob');
const mongoose = require('mongoose');

mongoose.Promise = Promise;
mongoose.connect(config.db, { useMongoClient: true });
const db = mongoose.connection;
db.on('error', function () {
	throw new Error('unable to connect to database at ' + config.db);
});

const models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
	require(model);
});
const app = express();

require('./lib/express')(app, config);
require('./lib/helpers')(app, config);

module.exports = app;
module.exports.closeDatabase = function () {
	mongoose.connection.close();
};
