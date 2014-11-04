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
	window.resultBuilder.prototype.outputQuery = function(query, queryString) {
		var url = window.location.href.split('#')[0].split('?')[0]  + '?lang=' + query.language + '&q=' + queryString;
		return this.outputPanel(
			'info',
			$('<div>')
				.append(
					$('<div>')
						.addClass('url-link')
						.append(
							$('<a>')
								.addClass('btn btn-default')
								.attr('href', url)
								.text('Link to this request')
						)
				)
				.append($('<div>').text('Query')),
			this.outputResultList([query])
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
				$('<div>').text('Result'),
				$('<div>')
					.addClass('panel-body')
					.text('After seven and a half million years of calculation I have found that the answer is 42.')
			);
		} else {
			return this.outputPanel(
				'success',
				$('<div>').text('Result'),
				this.outputResultList(results)
			);
		}
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputResultList = function(results) {
		var resultsRoot = $('<ul>')
			.addClass('list-group');
		for(var i in results) {
			resultsRoot.append(
				$('<li>')
					.addClass('list-group-item')
					.append(this.outputResult(results[i]))
			);
		}

		return resultsRoot;
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
			$('<div>').text('Error'),
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
	window.resultBuilder.prototype.outputPanel = function(type, $title, $body) {
		return $('<div>')
			.addClass('panel panel-' + type)
			.append(
				$('<div>')
					.addClass('panel-heading')
					.append($title)
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
			case 'sentence':
				return $('<span>')
					.addClass('label label-primary ppp-node ppp-sentence')
					.text(tree.value);
			default:
				return $('<span>')
					.addClass('label label-danger')
					.text(JSON.stringify(tree));
		}
	};

} (jQuery, window));
