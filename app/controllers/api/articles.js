//
// Name:    accounts.js
// Purpose: Controller and routing for Article model
// Creator: Tom Söderlund
//

'use strict';

const mongooseCrudify = require('mongoose-crudify');
const helpers = require('../../lib/helpers');
const Article = require('mongoose').model('Article');

// Private functions

const identifyingKey = 'reference';

// Public API

module.exports = function (app, config) {

	app.use(
		'/api/articles',
		mongooseCrudify({
			Model: Article,
			// identifyingKey: identifyingKey,
			// beforeActions: [
			// ],
			// endResponseInAction: false,
			// afterActions: [
			// 	{ middlewares: [helpers.sendRequestResponse] },
			// ],
		})
	);

};