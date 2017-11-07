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
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

const helpers = require('../../lib/helpers');
const { authenticateRequest } = require('../auth');
const Article = require('mongoose').model('Article');

// Private functions

const parseHtml = function (htmlString) {
	const $ = cheerio.load(htmlString);
	const title = helpers.splitTitle(entities.decode($('head meta[property="og:title"]').attr('content') || $('head title').text()));
	const description = entities.decode($('head meta[property="og:description"]').attr('content') || $('head meta[property="description"]').attr('content'));
	const imageUrl = $('head meta[property="og:image"]').attr('content') || $('head meta[property="twitter:image"]').attr('content');
	const siteName = $('head meta[property="og:site_name"]').attr('content') || $('head meta[property="application-name"]').attr('content');
	return {
		title: title,
		slug: helpers.toSlug(title),
		description: description,
		imageUrl: imageUrl,
		siteName: siteName,
	};
};

const keywordsFromText = function ({title, description}) {
	const titleFix = (title || '').toLowerCase();
	const descriptionFix = (description || '').toLowerCase();
	const allText = `${titleFix} ${descriptionFix}`;
	const allTheseKeywords = _.includesSome.bind(this, allText);
	const oneKeywordIfWordsMatch = (keyword, wordArray) => !_.isEmpty(_.includesSome(allText, wordArray)) ? keyword : undefined;
	const includeIfNotEmpty = (keyword, array) => !_.isEmpty(array) ? keyword : undefined;
	// Per category
	const keywordsMarketing = _([
		oneKeywordIfWordsMatch('marketing', ['market', 'campaign']),
		oneKeywordIfWordsMatch('ecommerce', ['e-commerce', 'ecommerce', 'commerce', 'retail', 'shop', 'purchas', 'payment']),
		oneKeywordIfWordsMatch('contentmarketing', ['content', 'copywrit', 'viral']),
		oneKeywordIfWordsMatch('subscriptions', ['subscription']),
		oneKeywordIfWordsMatch('growthhacking', ['growthhack', 'growth hack']),
		oneKeywordIfWordsMatch('seo', ['seo', 'keyword', 'search']),
		oneKeywordIfWordsMatch('copywriting', ['copywrit']),
		oneKeywordIfWordsMatch('acquisition', ['acquisition', 'traffic']),
		oneKeywordIfWordsMatch('sales', ['sales', 'outbound']),
		oneKeywordIfWordsMatch('analytics', ['analytic', 'metric']),
		oneKeywordIfWordsMatch('adtech', ['adtech', 'dsp', 'ssp']),
		oneKeywordIfWordsMatch('socialmedia', ['social media', 'facebook', 'twitter', 'youtube', 'instagram', 'snapchat']),

		allTheseKeywords(['google', 'facebook', 'twitter', 'youtube', 'instagram']),
		allTheseKeywords(['growth', 'saas', 'ranking', 'viral', 'email', 'metrics', 'engagement', 'retention']),
	]).flatten().compact().value();
	const keywordsDesign = _([
		oneKeywordIfWordsMatch('design', ['design']),
		oneKeywordIfWordsMatch('graphicdesign', ['graphic design', 'logo']),
		oneKeywordIfWordsMatch('webdesign', ['web design']),
		oneKeywordIfWordsMatch('ux', ['ux', 'user experience', 'customer experience', 'interact']),
		oneKeywordIfWordsMatch('branding', ['brand']),
		oneKeywordIfWordsMatch('typography', ['typography', 'font', 'typeface']),
	]).flatten().compact().value();
	// Meta/topic keywords
	const metaKeywords = [
		includeIfNotEmpty('marketing', keywordsMarketing),
		includeIfNotEmpty('design', keywordsDesign),
	];
	// Combine all
	const allKeywords = _([metaKeywords, keywordsMarketing, keywordsDesign]).flatten().uniq().compact().value();
	return allKeywords;
};

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
			// Clean up keywords
			if (postedProps.keywords) {
				postedProps.keywords = _.map(postedProps.keywords, keyword => keyword.replace(/[^\w-]+/g,''));
			}
			// Extra keywords from title/description
			postedProps.keywords = _(postedProps.keywords).concat(keywordsFromText(htmlProps)).compact().uniq().value();
			// Merge all props
			_.merge(req.body, htmlProps, postedProps);
			next();
		}
	});
};

const formatArticleJson = function (req, res, next) {
	// Hashtags
	const hashtags = _(req.crudify.result.keywords).slice(0, 3).value();
	const hashtagsString = hashtags.length > 0 ? '#' + hashtags.join(' #') : '';
	req.crudify.result = req.crudify.result.toJSON();
	if (hashtags.length > 0) {
		req.crudify.result.hashtags = hashtagsString;
	}
	req.crudify.result.commentOrTitle = req.crudify.result.comment || req.crudify.result.title;
	next();
};

// Public API

module.exports = function (app, config) {

	app.use(
		'/api/articles',
		mongooseCrudify({
			Model: Article,
			beforeActions: [
				{ middlewares: [authenticateRequest] },
				{ middlewares: [prepareArticle], only: ['create'] },
			],
			endResponseInAction: false,
			afterActions: [
				{ middlewares: [formatArticleJson], only: ['read', 'create', 'update'] },
				{ middlewares: [helpers.sendRequestResponse] },
			],
		})
	);

};