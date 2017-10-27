'use strict';

const bodyParser = require('body-parser');
const compress = require('compression');
//const cookieParser = require('cookie-parser');
//const cors = require('cors');
const express = require('express');
//const favicon = require('serve-favicon');
const glob = require('glob');
const logger = require('morgan');
//const methodOverride = require('method-override');

module.exports = function (app, config) {
	app.set('views', config.root + '/app/views');
	app.set('view engine', 'ejs');

	//app.use(favicon(config.root + '/public/img/favicon.ico'));
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	//app.use(cookieParser());
	app.use(compress());
	app.use(express.static(config.root + '/public'));

	// Other NPMs
	app.use('/weld-static-assets', express.static(config.root + '/node_modules/@weld-io/weld-static-assets'));
	//app.use(methodOverride());
	//app.use(cors());

	// Routing

	// Require in Auth controller
	const authController = require(config.root + '/app/controllers/auth');
	authController(app, config);

	// Require in all API controllers
	glob.sync(config.root + '/app/controllers/api/*.js').forEach(controllerPath => require(controllerPath)(app, config));

	// Other routes
	require('./routes')(app, config);

	app.use(function (req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	if (app.get('env') === 'development') {
		app.use(function (err, req, res, next) {
			res.status(err.status || 500);
			res.render('shared/error', {
				message: err.message,
				error: err,
				title: 'error'
			});
		});
	}

	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('shared/error', {
			message: err.message,
			error: {},
			title: 'error'
		});
	});

};