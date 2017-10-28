/**
 * Application routes for REST
 */

'use strict';

var express = require('express');

module.exports = function (app, config) {

	var router = express.Router();
	app.use('/', router);

	// Web
	var webArticlesController = require(config.root + '/app/controllers/web/articles');

	router.get('/:slug', webArticlesController.show);
	router.get('/', webArticlesController.list);

};