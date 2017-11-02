'use strict';

const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');
const translate = require('google-translate-api');

const auth = require('../auth');
const helpers = require('../../lib/helpers');
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
			article.originalSlug = article.slug;
			res.render('articles/show', {
				title: 'Articles',
				article: article,
				isAuthenticated: auth.isAuthenticated(req),
				password: auth.getPassword(req),
				languageCode: req.params.languageCode || 'en',
			});
		});
	},

	showTranslated: function (req, res, next) {
		Article.findOne().elemMatch('translations', { languageCode: req.params.languageCode, slug: req.params.slug }).exec(function (err, article) {
			if (err || article === null) {
				return next(err);
			}
			const translation = _.chain(article.translations).find(trn => trn.languageCode === req.params.languageCode).pickBy((val, key) => key !== '_id').value();
			const translatedArticle = _.merge({ originalSlug: article.slug }, article, translation);
			res.header('Content-Language', req.params.languageCode);
			res.render('articles/show', {
				title: 'Articles',
				article: translatedArticle,
				isAuthenticated: auth.isAuthenticated(req),
				password: auth.getPassword(req),
				languageCode: req.params.languageCode || 'en',
			});
		});
	},

	translateAndRedirect: function (req, res, next) {

		const translateAll = (collection, toLanguage, cbWhenAllDone) => {
			let translations = {};
			async.eachOf(collection,
				// For each
				function (str, key, cb) {
					translate(str, { from: 'en', to: toLanguage }).then(result => {
						translations[key] = result.text;
						cb();
					}).catch(cb);
				},
				// When all done
				function (err) {
					cbWhenAllDone(err, translations);
				}
			);
		}

		Article.findById(req.params.id).exec(function (err, article) {
			if (err || article === null) {
				console.log('req.params', req.params);
				return next(err);
			}
			const toTranslate = _(article).pick(['title', 'description', 'comment' /*, 'keywords'*/]).pickBy(val => val !== undefined).value();
			translateAll(toTranslate, req.params.languageCode, (err, translations) => {
				if (err) {
					res.status(500).send(err);
				}
				else {
					const slug = helpers.toSlug(translations.title);
					const translationObj = _.merge({ languageCode: req.params.languageCode, slug: slug }, translations);
					article.translations.push(translationObj);
					article.save(errSave => {
						if (err)
							res.status(500).send(errSave);
						res.status(301).redirect(`/${req.params.languageCode}/${slug}`);
					});
				}
			})
		});
	},

}