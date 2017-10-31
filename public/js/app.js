'use strict';

var ClickSite = ClickSite || {};

;(function (ClickSite) {

	var apiRequest = function (requestType, collection, recordId, jsonObj, password, cbSuccess, cbError) {
		$.ajax({
			url: '/api/' + collection + '/' + recordId + '?password=' + password,
			type: requestType.toUpperCase(),
			contentType: 'application/json',
			data: JSON.stringify(jsonObj),
			success: cbSuccess || function(result) {
				console.log('success', result);
			},
			error: cbError || function(err) {
				console.error('error', err);
			},
		});
	};

	ClickSite.addComment = function (articleId, password) {
		var comment = prompt('Comment');
		apiRequest('put', 'articles', articleId, { comment: comment }, password, function(result) {
			location.reload();
		});
	};

}(ClickSite));