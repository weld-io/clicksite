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
				languageCode: req.params.languageCode || article.languageCode || 'en',
			});
		});
	},

	showTranslated: function (req, res, next) {
		Article.findOne().elemMatch('translations', { languageCode: req.params.languageCode, slug: req.params.slug }).exec(function (err, article) {
			if (err || article === null) {
				return next(err);
			}
			const translation = _.chain(article.translations).find(trn => trn.languageCode === req.params.languageCode).pickBy((val, key) => key !== '_id').value();
			const translatedArticle = _.merge({ originalSlug: article.slug }, article, translation, { languageCode: article.languageCode });
			res.header('Content-Language', req.params.languageCode);
			res.render('articles/show', {
				title: 'Articles',
				article: translatedArticle,
				isAuthenticated: auth.isAuthenticated(req),
				password: auth.getPassword(req),
				languageCode: req.params.languageCode || article.languageCode || 'en',
			});
		});
	},

	translateAndRedirect: function (req, res, next) {

		const translateAll = (collection, fromLanguage, toLanguage, cbWhenAllDone) => {
			let translations = {};
			async.eachOf(collection,
				// For each
				function (str, key, cb) {
					translate(str, { from: fromLanguage, to: toLanguage }).then(result => {
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

		Article.findById(req.params.id).exec(function (errFind, article) {
			if (errFind || article === null) {
				console.error('Find error:', {errFind, params:req.params});
				return next(errFind);
			}
			const toTranslate = _(article).pick(['title', 'description', 'comment' /*, 'keywords'*/]).pickBy(val => val !== undefined).value();
			const fromLanguage = article.languageCode || 'en';
			translateAll(toTranslate, fromLanguage, req.params.languageCode, (errTranslate, translations) => {
				if (errTranslate) {
					console.error('Translate error:', errTranslate);
					res.status(500).send(errTranslate);
				}
				else {
					const slug = helpers.toSlug(translations.title);
					const translationObj = _.merge({ languageCode: req.params.languageCode, slug: slug }, translations);
					article.translations.push(translationObj);
					article.save(errSave => {
						if (errSave) {
							console.error('Save error:', errSave);
							res.status(500).send(errSave);
						}
						else {
							res.status(301).redirect(`/${req.params.languageCode}/${slug}`);
						}
					});
				}
			})
		});
	},

}