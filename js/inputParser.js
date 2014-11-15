/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	/**
	 * Parse the input
	 *
	 * @class
	 * @constructor
	 */
	window.inputParser = function() {
		this.text = '';
		this.position = 0;
	};

	/**
	 * Parse an input and returns a tree
	 *
	 * @param {string} text
	 * @return {object}
	 */
	window.inputParser.prototype.parse = function(text) {
		this.text = text.trim();
		this.position = 0;

		if((this.text[0] == '(' && this.text[this.text.length - 1] == ')')) {
			return this.parseTriple(this.text);
		}

		return {'type': 'sentence', 'value': this.text};
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.internalParse = function(end) {
		while(this.text[this.position] == ' ') {
			this.position++;
		}
		if(this.text[this.position] === '?') {
			this.position += 2;
			return {'type': 'missing'};
		}

		if(this.text[this.position] == '(') {
			var triple = this.parseTriple(end);
			this.position++;
			return triple;
		}

		return this.parseResource(end);
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.parseResource = function(end) {
		var node = {
			'type': 'resource',
			'value': ''
		};

		for(; this.position < this.text.length && this.text[this.position] !== end; this.position++) {
			node.value += this.text[this.position];
		}
		this.position++;

		return node;
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.parseTriple = function(end) {
		this.position++;

		return {
			'type': 'triple',
			'subject': this.internalParse(','),
			'predicate': this.internalParse(','),
			'object': this.internalParse(')')
		};
	};

} (jQuery, window));
