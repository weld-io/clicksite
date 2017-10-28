//
// Name:    accounts.js
// Purpose: Controller and routing for Article model
// Creator: Tom Söderlund
//

'use strict';

const mongooseCrudify = require('mongoose-crudify');
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

const helpers = require('../../lib/helpers');
const Article = require('mongoose').model('Article');

// Private functions

const parseHtml = function (htmlString) {
	const $ = cheerio.load(htmlString);
	const title = $('head meta[property="og:title"]').attr('content') || $('head title').text();
	const description = $('head meta[property="og:description"]').attr('content') || $('head meta[property="description"]').attr('content');
	const imageUrl = $('head meta[property="og:image"]').attr('content') || $('head meta[property="twitter:image"]').attr('content');
	const siteName = $('head meta[property="og:site_name"]').attr('content') || $('head meta[property="application-name"]').attr('content');
	return {
		title: title,
		slug: helpers.toSlug(title),
		description: description,
		imageUrl: imageUrl,
		siteName: siteName,
	};
}

const prepareArticle = function (req, res, next) {
	request(req.body.url, function (error, response, body) {
		if (response.statusCode !== 200) {
			res.status(response.statusCode).send(`${response.statusCode}: ${response.statusMessage}`);
		}
		else if (error) {
			res.status(500).send(error);
		}
		else {
			// Parse HTML
			const htmlProps = parseHtml(body);
			// Merge req.body last = e.g. user-provided 'title' has priority
			let postedProps = _.clone(req.body);
			if (typeof(postedProps.keywords) === 'string') {
				postedProps.keywords = postedProps.keywords.toLowerCase().split(',');
			}
			_.merge(req.body, htmlProps, postedProps);
			next();
		}
	});
};

const addHashtags = function (req, res, next) {
	const hashtags = _(req.crudify.result.keywords).slice(0, 3).value();
	const hashtagsString = hashtags.length > 0 ? '#' + hashtags.join(' #') : '';
	req.crudify.result = req.crudify.result.toJSON();
	if (hashtags.length > 0) {
		req.crudify.result.hashtags = hashtagsString;
	}
	next();
};

// Public API

module.exports = function (app, config) {

	app.use(
		'/api/articles',
		mongooseCrudify({
			Model: Article,
			beforeActions: [
				{ middlewares: [prepareArticle], only: ['create'] },
			],
			endResponseInAction: false,
			afterActions: [
				{ middlewares: [addHashtags], only: ['read', 'create', 'update'] },
				{ middlewares: [helpers.sendRequestResponse] },
			],
		})
	);

};