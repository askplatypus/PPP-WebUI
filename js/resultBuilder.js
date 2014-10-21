/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	/**
	 * Build the output for the results
	 *
	 * @class
	 * @constructor
	 */
	window.resultBuilder = function() {
	};

	/**
	 * Builds a box for the query.
	 *
	 * @param {object} query The query done.
	 * @return {jQuery}
	 */
	window.resultBuilder.prototype.outputQuery = function(query) {
		return this.outputPanel(
			'info',
			'Query',
			$('<div>')
				.addClass('panel-body')
				.append(this.outputTree(query))
		);
	};

	/**
	 * Builds a box for the results.
	 *
	 * @param {array} results The results.
	 * @return {jQuery}
	 */
	window.resultBuilder.prototype.outputResults = function(results) {
		if(results.length === 0) {
			return this.outputPanel(
				'warning',
				'Result',
				$('<div>')
					.addClass('panel-body')
					.text('After seven and a half million years of calculation I have found that the answer is 42.')
			);
		}

		var resultsRoot = $('<ul>')
			.addClass('list-group');
		for(var i in results) {
			resultsRoot.append(
				$('<li>')
					.addClass('list-group-item')
					.append(this.outputResult(results[i]))
			);
		}

		return this.outputPanel(
			'success',
			'Result',
			resultsRoot
		);
	};

	/**
	 * Builds a box for an error.
	 *
	 * @param {string} error Error message.
	 * @return {jQuery}
	 */
	window.resultBuilder.prototype.outputError = function(error) {
		return this.outputPanel(
			'danger',
			'Error',
			$('<div>')
				.addClass('panel-body')
				.text(error)
		);
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputResult = function(result) {
		return $('<div>')
			.attr('lang', result.language)
			.append(this.outputTree(result.tree));
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputPanel = function(type, title, $body) {
		return $('<div>')
			.addClass('panel panel-' + type)
			.append(
				$('<div>')
					.addClass('panel-heading')
					.text(title)
			)
			.append($body);
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputTree = function(tree) {
		switch(tree.type) {
			case 'triple':
				return $('<span>')
					.addClass('label label-default ppp-node ppp-triple')
					.append('(')
					.append(this.outputTree(tree.subject))
					.append(',')
					.append(this.outputTree(tree.predicate))
					.append(',')
					.append(this.outputTree(tree.object))
					.append(')');
			case 'resource':
				return $('<span>')
					.addClass('label label-info ppp-node ppp-resource')
					.text(tree.value);
			case 'missing':
				return $('<span>')
					.addClass('label label-warning ppp-node ppp-missing')
					.text('?');
			default:
				return $('<span>')
					.addClass('label label-danger')
					.text(JSON.stringify(tree));
		}
	};

} (jQuery, window));
