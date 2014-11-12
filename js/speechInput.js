/**
 * Setups the speech input for supported browsers
 *
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 *
 * @todo support mobile layout
 */
(function($, window) {
	'use strict';

	/**
	 * @class
	 * @constructor
	 *
	 * @param {string} languageCode The language results should be speak in.
	 */
	window.speechInput = function(languageCode) {
		this.languageCode = languageCode;
		this.$icon = null;
	};

	/**
	 * Speaks the result if possible.
	 *
	 * @param {function} success the function called on success
	 */
	window.speechInput.prototype.setupSpeechInput = function(success) {
		if(!this.isSpeakSupported()) {
			return;
		}
		var speechInput = this;

		var recognition = new webkitSpeechRecognition();
		recognition.lang = this.languageCode;
		recognition.onresult = function(event) {
			success(speechInput.buildResult(event));
		};
		recognition.onstart = function(event) {
			speechInput.$icon.addClass('fa-spin');
		};
		recognition.onend = function(event) {
			speechInput.$icon.removeClass('fa-spin');
		};

		this.setupSpeakButton().click(function() {
			recognition.start();

		});
	};

	/**
	 * @private
	 */
	window.speechInput.prototype.buildResult = function(event) {
		var result = '';
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			if (event.results[i].isFinal) {
				result += event.results[i][0].transcript.trim() + ' ';
			}
		}
		return result;
	};

	/**
	 * @private
	 */
	window.speechInput.prototype.isSpeakSupported = function() {
		return 'webkitSpeechRecognition' in window;
	};

	/**
	 * @private
	 */
	window.speechInput.prototype.setupSpeakButton = function() {
		this.$icon = $('<span>')
			.addClass('fa fa-microphone');

		return $('<button>')
			.attr({
				'type': 'button',
				'title': 'Speech input'
			})
			.addClass('btn btn-default btn-lg')
			.append(this.$icon)
			.insertBefore($('#simplesearch-button-submit'));
	};

} (jQuery, window));
