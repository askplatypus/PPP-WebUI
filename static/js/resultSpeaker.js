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
		results = results.filter(function(result) {
			return result.tree.type === 'resource';
		});

		if(results.length === 0) {
			return 'After seven and a half million years of calculation I have found that the answer is 42.';
		}

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
	 * @todo improve
	 */
	window.resultSpeaker.prototype.buildSpokenMessageForResource = function(resource) {
		return resource.value;
	};

} (jQuery, window));
