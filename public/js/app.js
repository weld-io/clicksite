'use strict';

var ClickSite = ClickSite || {};

;(function (ClickSite) {

	var apiRequest = function (requestType, collection, recordId, jsonObj, password, cbSuccess, cbError) {
		$.ajax({
			url: '/api/' + collection + (recordId ? '/' + recordId : '') + '?password=' + password,
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

	ClickSite.addArticle = function (password) {
		var url = prompt('Article URL');
		var jsonObj = { url: url };
		var keywords = prompt('Keywords (comma-separated, no spaces)');
		if (keywords) {
			jsonObj.keywords = keywords;
		}
		apiRequest('post', 'articles', undefined, jsonObj, password, function(result) {
			//location.reload();
			location.href = '/' + result.slug;
		});
	};

	ClickSite.addComment = function (articleId, password) {
		var comment = prompt('Comment');
		apiRequest('put', 'articles', articleId, { comment: comment }, password, function(result) {
			location.reload();
		});
	};

}(ClickSite));