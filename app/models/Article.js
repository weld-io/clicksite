'use strict';

const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const Schema = mongoose.Schema;

const TranslatedArticle = new Schema({
	languageCode: { type: String, required: true },
	slug: { type: String, required: true },
	title: { type: String, required: true },
	description: { type: String },
	comment: { type: String },
	keywords: [String],
});

const Article = new Schema({
	url: { type: String, required: true, unique: true },
	slug: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	description: { type: String },
	imageUrl: { type: String },
	siteName: { type: String },
	comment: { type: String },
	dateCreated: { type: Date, default: Date.now },
	keywords: [String],
	languageCode: { type: String, default: 'en' },
	translations: [TranslatedArticle],
});

Article.plugin(findOrCreate);

mongoose.model('Article', Article);
