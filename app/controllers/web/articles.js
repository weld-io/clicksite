'use strict';

const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');

const auth = require('../auth');
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
				articles: articles,
				isAuthenticated: auth.isAuthenticated(req),
				password: auth.getPassword	(req),
			});
		});
	},

	show: function (req, res, next) {
		Article.findOne({ slug: req.params.slug }).exec(function (err, article) {
			if (err || article === null) {
				return next(err);
			}
			res.render('articles/show', {
				title: 'Articles',
				article: article,
				isAuthenticated: auth.isAuthenticated(req),
				password: auth.getPassword	(req),
			});
		});
	},

	showTranslated: function (req, res, next) {
		Article.findOne().elemMatch('translations', { languageCode: req.params.languageCode, slug: req.params.slug }).exec(function (err, article) {
			if (err || article === null) {
				return next(err);
			}
			const translation = _.find(article.translations, trn => trn.languageCode === req.params.languageCode);
			const translatedArticle = _.merge({}, article, translation);
			res.render('articles/show', {
				title: 'Articles',
				article: translatedArticle,
				isAuthenticated: auth.isAuthenticated(req),
				password: auth.getPassword	(req),
			});
		});
	},

}