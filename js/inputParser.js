/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function(window) {
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

		try {
			return this.parseTriple(null);
		} catch(e) {
			return {
				'type': 'sentence',
				'value': this.text
			};
		}
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.parseNode = function(end) {
		this.ignoreSpaces();

		if(this.text[this.position] === '?') {
			return this.parseMissing(end);
		}

		if(this.text[this.position] == '(') {
			return this.parseTriple(end);
		}

		return this.parseResource(end);
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.parseMissing = function(end) {
		this.ignoreSpaces();

		if(this.text[this.position] !== '?') {
			throw new SyntaxError("Invalid missing node");
		}
		this.position++;

		this.checkEnd(end);

		return {'type': 'missing'};
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.parseResource = function(end) {
		var value = '';
		for(; this.position < this.text.length && this.text[this.position] !== end; this.position++) {
			value += this.text[this.position];
		}
		if(this.position === this.text.length) {
			throw new SyntaxError("Invalid end after resource node");
		}
		this.position++;

		return {
			'type': 'resource',
			'value': value.trim()
		};
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.parseTriple = function(end) {
		this.ignoreSpaces();

		if(this.text[this.position] !== '(') {
			throw new SyntaxError("Invalid triple");
		}
		this.position++;

		var result = {
			'type': 'triple',
			'subject': this.parseNode(','),
			'predicate': this.parseNode(','),
			'object': this.parseNode(')')
		};

		if(end !== null) {
			this.checkEnd(end);
		}

		return result;
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.checkEnd = function(end) {
		this.ignoreSpaces();

		if(this.text[this.position] !== end) {
			throw new SyntaxError("Invalid end " + end);
		}
		this.position++;
	};

	/**
	 * @private
	 */
	window.inputParser.prototype.ignoreSpaces = function() {
		while(this.text[this.position] === ' ' || this.text[this.position] === '\t') {
			this.position++;
		}
	};

} (window));
