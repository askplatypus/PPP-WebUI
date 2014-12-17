/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	/**
	 * speaks the output of the results
	 *
	 * @class
	 * @constructor
	 *
	 * @param {string} languageCode The language results should be speak in.
	 */
	window.resultSpeaker = function(languageCode) {
		this.languageCode = languageCode;
	};

	/**
	 * Speaks the result if possible.
	 *
	 * @param {array} results The results.
	 */
	window.resultSpeaker.prototype.speakResults = function(results) {
		if(!this.isSpeakSupported()) {
			return;
		}

		var msg = new SpeechSynthesisUtterance(this.buildSpokenMessage(results));
		msg.lang = this.languageCode;
		window.speechSynthesis.speak(msg);
	};

	/**
	 * @private
	 */
	window.resultSpeaker.prototype.isSpeakSupported = function() {
		return 'speechSynthesis' in window;
	};

	/**
	 * @private
	 */
	window.resultSpeaker.prototype.buildSpokenMessage = function(results) {
		if(results.length === 0) {
			return 'After seven and a half million years of calculation I have found that the answer is 42.';
		}
		
		results = results.filter(function(result) {
			return result.tree.type === 'resource';
		});

		var text = '';
		if(results.length === 1) {
			text = 'The answer is: ';
		} else {
			text = 'The answers are: ';
		}

		for(var i in results) {
			text += this.buildSpokenMessageForResource(results[i].tree) + ' ';
		}

		return text;
	};

	/**
	 * @private
	 */
	window.resultSpeaker.prototype.buildSpokenMessageForResource = function(resource) {
		if(!('value-type' in resource)) {
			resource['value-type'] = 'string';
		}

		switch(resource['value-type']) {
			case 'wikibase-entity':
				return resource.value + ' (' + resource.description + ')';
			default:
				return resource.value;
		}
	};

} (jQuery, window));
