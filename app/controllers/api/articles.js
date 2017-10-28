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

const identifyingKey = 'reference';

const parseHtml = function (htmlString) {
	const $ = cheerio.load(htmlString);
	const title = $('head meta[property="og:title"]').attr('content') || $('head title').text();
	const description = $('head meta[property="og:description"]').attr('content') || $('head meta[property="description"]').attr('content');
	const imageUrl = $('head meta[property="og:image"]').attr('content') || $('head meta[property="twitter:image"]').attr('content');
	return {
		title: title,
		slug: helpers.toSlug(title),
		description: description,
		imageUrl: imageUrl,
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
			// Merge req.body last = e.g. user-provided 'title' has priority
			let oldProps = _.clone(req.body);
			if (typeof(oldProps.keywords) === 'string') {
				oldProps.keywords = oldProps.keywords.split(',');
			}
			_.merge(req.body, parseHtml(body), oldProps);
			next();
		}
	});
};

// Public API

module.exports = function (app, config) {

	app.use(
		'/api/articles',
		mongooseCrudify({
			Model: Article,
			//identifyingKey: identifyingKey,
			beforeActions: [
				{ middlewares: [prepareArticle], only: ['create'] },
			],
			// endResponseInAction: false,
			// afterActions: [
			// 	{ middlewares: [helpers.sendRequestResponse] },
			// ],
		})
	);

};