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

	ClickSite.editDataField = function (collectionName, recordId, fieldName, defaultValue, password) {
		var newData = {};
		var newDefaultValue = defaultValue.replace(/[\[\]]/g, ''); // array, remove []
		newData[fieldName] = prompt(fieldName + '?', newDefaultValue);
		// If array, then split
		if (defaultValue.indexOf('[') !== -1) {
			newData[fieldName] = newData[fieldName].split(',');
		}
		apiRequest('put', collectionName, recordId, newData, password, function(result) {
			location.reload();
		});
	};

	ClickSite.addArticle = function (password) {
		var url = prompt('Article URL');
		var jsonObj = { url: url };
		var keywords = prompt('Keywords (comma-separated, no spaces)');
		if (keywords) jsonObj.keywords = keywords;
		var comment = prompt('Your own comment why this is a good article\n(no period/exclamation point at the end)');
		if (comment) jsonObj.comment = comment;
		apiRequest('post', 'articles', undefined, jsonObj, password, function(result) {
			location.reload();
			//location.href = '/' + result.slug;
		});
	};

	ClickSite.addComment = function (articleId, password) {
		var comment = prompt('Comment');
		apiRequest('put', 'articles', articleId, { comment: comment }, password, function(result) {
			location.reload();
		});
	};

	ClickSite.trackClickArticle = function (slug, languageCode) {
		gtag('event', 'select_content', { content_type: slug, content: slug, language: languageCode });
	};

	ClickSite.trackClickAd = function (event, slug, languageCode) {
		event.preventDefault();
		gtag('event', 'view_promotion', { content: slug, language: languageCode, event_callback: function () {
			location.href = event.target.parentElement.getAttribute('href');
		} });
	};

}(ClickSite));