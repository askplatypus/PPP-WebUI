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
	 * @param {string} queryUrl URL to this query.
	 * @return {jQuery}
	 */
	window.resultBuilder.prototype.outputQuery = function(query, queryUrl) {
		return this.outputPanel(
			'info',
			$('<div>')
				.append(
					$('<div>')
						.addClass('url-link')
						.append(
							$('<a>')
								.addClass('btn btn-default')
								.attr('href', queryUrl)
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
					.append(this.outputResource(tree));
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

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputResource = function(resource) {
		if(!('value-type' in resource)) {
			resource['value-type'] = 'string';
		}
		switch(resource['value-type']) {
			case 'string':
				var $node = $('<span>');
				if('language' in resource && resource.language !== '') {
					$node.attr('lang', resource.language);
				}
				return $node.text(resource.value);
			case 'time':
				var formattedDate = (new Date(resource.value)).toLocaleString();
				if(formattedDate === 'Invalid Date') {
					formattedDate = resource.value;
				}
				return $('<time>')
					.attr('datetime', resource.value)
					.text(formattedDate);
			default:
				return $('<span>')
					.text(resource.value);
		}
	};

} (jQuery, window));
