'use strict';

const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');

const Article = mongoose.model('Article');

module.exports = {

	list: function (req, res, next) {
		var searchQuery = {};
		if (req.params.after) {
			searchQuery['dateCreated'] = searchQuery['dateCreated'] || {};
			searchQuery['dateCreated']['$gte'] = new Date(req.params.after);
		}
		if (req.params.before) {
			searchQuery['dateCreated'] = searchQuery['dateCreated'] || {};
			searchQuery['dateCreated']['$lt'] = new Date(req.params.before);
		}

		const sorting = { 'dateCreated': -1 };
		// Execute query
		Article.find(searchQuery).limit(50).sort(sorting).exec(function (err, articles) {
			if (err)
				return next(err);
			res.render('articles/list', {
				title: 'Articles',
				articles: articles
			});
		});
	},

	show: function (req, res, next) {
		var searchQuery = {};
		// Execute query
		Article.find(searchQuery).exec(function (err, article) {
			if (err)
				return next(err);
			res.render('articles/show', {
				title: 'Articles',
				article: article
			});
		});
	},

}