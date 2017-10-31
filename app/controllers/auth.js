'use strict';

const _ = require('lodash');
const express = require('express');

module.exports.authenticateUser = function (req, res, next) {
	if (req.query.password !== process.env.API_PASSWORD) {
		return res.sendStatus(401)
	}
	next()
};
