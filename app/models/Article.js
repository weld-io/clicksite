'use strict';

const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const Schema = mongoose.Schema;

// https://developer.github.com/v3/activity/events/types/#issuesevent
const Article = new Schema({
	url: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	description: { type: String },
	dateCreated: { type: Date, default: Date.now },
	keywords: [String],
});

Article.plugin(findOrCreate);

mongoose.model('Article', Article);
