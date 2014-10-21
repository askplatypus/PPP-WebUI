/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 *
 * @todo nice output
 * @todo interpretation of the question
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
	 * Set the pending element (and clean up any existing one).
	 *
	 * @param {object} query The query done
	 * @param {array} results Results
	 * @return {jQuery}
	 */
	window.resultBuilder.prototype.outputResults = function(query, results) {
		var root = $('<div>')
			.addClass('panel')
			.append(
				$('<div>')
					.addClass('panel-heading')
					.text('Result')
			)
			.append(
				$('<div>')
					.addClass('panel-body')
					.text('Query: ')
					.append(window.resultBuilder.prototype.outputTree(query))
			);

		var resultsRoot = $('<ul>')
			.addClass('list-group');
		if(results.length === 0) {
			root.addClass('panel-warning');
			resultsRoot.append(
				$('<li>')
					.addClass('list-group-item')
					.text('No answers.')
			);
		} else {
			root.addClass('panel-success');
			$.each(results, function(_, result) {
				resultsRoot.append(
					$('<li>')
						.addClass('list-group-item')
						.append(window.resultBuilder.prototype.outputResult(result))
				);
			});
		}
		root.append(resultsRoot);

		return root;
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputResult = function(result) {
		return $('<div>')
			.text('Result: ')
			.append(
				$('<span>')
					.attr('lang', result.language)
					.append(window.resultBuilder.prototype.outputTree(result.tree))
			);

	};

	/**
	 *
	 * @param {object} tree
	 * @return {jQuery}
	 */
	window.resultBuilder.prototype.outputTree = function(tree) {
		switch(tree.type) {
			case 'triple':
				return $('<span>')
					.addClass('label label-default ppp-node ppp-triple')
					.append('(')
					.append(window.resultBuilder.prototype.outputTree(tree.subject))
					.append(',')
					.append(window.resultBuilder.prototype.outputTree(tree.predicate))
					.append(',')
					.append(window.resultBuilder.prototype.outputTree(tree.object))
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
