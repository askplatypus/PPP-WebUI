/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	/**
	 * Allows to interact with the core module
	 *
	 * @class
	 * @constructor
	 * @param {string} url Url of the core API endpoint
	 */
	window.pppApi = function(url) {
		this.url = url;
	};

	/**
	 * Ask a question to the API
	 *
	 * @param {string} question the question
	 * @param {string} languageCode the question
	 */
	window.pppApi.prototype.ask = function (question, languageCode) {
		return $.ajax({
			url: this.url + '/v0/ask',
			dataType: 'json',
			data: {
				q: question,
				lang: languageCode
			},
			headers: {
				'Accept-Language': languageCode
			}
		});
	};

	/**
	 * Returns the sample questions for a given language
	 *
	 * @param {Object} languageCode parameters parameters to pass to the API
	 * @raturn {jQuery.Promise}
	 */
	window.pppApi.prototype.getSampleQuestions = function(languageCode) {
		return $.ajax({
			url: this.url + '/v0/samples',
			dataType: 'json',
			headers: {
				'Accept-Language': languageCode
			}
		});
	};

} (jQuery, window));
