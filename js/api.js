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
	 * Set the pending element (and clean up any existing one).
	 *
	 * @param {Object} parameters parameters to pass to the API
	 * @param {Function} success callback called on success with as parameter an Object with the result of the request
	 */
	window.pppApi.prototype.sendRequest = function(parameters, success) {
		$.ajax({
			url: this.url,
			type: 'POST',
			contentType: 'application/json',
			dataType: 'json',
			data: JSON.stringify(parameters)
		})
		.done(function(result) {
			success(result);
		})
		.fail(function() {
			//TODO
		});
	};

} (jQuery, window));
