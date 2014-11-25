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

	window.resultBuilder.resourceFormatters = {

		'string': function(resource) {
			var $node = $('<span>');
			if ('language' in resource && resource.language !== '') {
				$node.attr('lang', resource.language);
			}
			return $node.text(resource.value);
		},

		'time': function(resource, language) {
			var formattedDate = '';
			var dateObject = new Date(resource.value);
			var formattingOptions = {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric"
			};

			if (resource.value.indexOf('T') === -1) {
				formattedDate = dateObject.toLocaleDateString(language, formattingOptions);
			} else {
				formattedDate = dateObject.toLocaleString(language, formattingOptions);
			}
			if (formattedDate === 'Invalid Date') {
				formattedDate = resource.value;
			}
			return $('<time>')
				.attr('datetime', resource.value)
				.text(formattedDate);
		},

		'math-latex': function(resource) {
			return $('<script>')
				.attr('type', 'math/tex')
				.text(resource.value);
		},

		'wikibase-entity': function(resource, language) {
			var entityId = resource['entity-id'];
			var $label = $('<span>')
				.text(resource.value);
			if ('description' in resource && resource.description !== '') {
				$label.attr('title', resource.description);
			}

			$.ajax({
				'url': '//www.wikidata.org/w/api.php',
				'data': {
					'format': 'json',
					'action': 'wbgetentities',
					'ids': entityId,
					'languages': language
				},
				'dataType': 'jsonp'
			}).done(function(data) {
				if(data.entities[entityId].sitelinks && (language + 'wiki') in data.entities[entityId].sitelinks) {
					$('<a>')
						.attr('href', '//' +  language + '.wikipedia.org/wiki/' + data.entities[entityId].sitelinks[language + 'wiki'].title)
						.attr('title', 'Wikipedia')
						.addClass('icon-wikipedia')
						.appendTo('#wikibase-entity-' + entityId)
				}
			} );

			return $('<span>')
				.attr('id', 'wikibase-entity-' + entityId)
				.append($label)
				.append(
					$('<a>')
						.attr('href', '//www.wikidata.org/entity/' + entityId)
						.attr('title', 'Wikidata')
						.addClass('icon-wikidata')
				);
		}
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
		var displayedResults = [];
		var hiddenResults = [];

		for(var i in results) {
			if(results[i].tree.type === 'resource') {
				displayedResults.push(results[i]);
			} else {
				hiddenResults.push(results[i]);
			}
		}

		var panelType = 'success';
		if(displayedResults.length === 0) {
			panelType = 'warning';
		}

		var title = $('<div>');
		if(hiddenResults.length > 0) {
			title.append(this.outputShowHiddenResultsButton());
		}
		title.append($('<div>').text('Result'));

		return this.outputPanel(
			panelType,
			title,
			this.outputResultList(displayedResults, hiddenResults)
		);
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputResultList = function(displayedResults, hiddenResults) {
		var resultsRoot = $('<ul>')
			.addClass('list-group');

		if(displayedResults.length === 0) {
			resultsRoot.append(
				$('<li>')
					.addClass('list-group-item')
					.text('After seven and a half million years of calculation I have found that the answer is 42.')
			);
		} else {
			for(var i in displayedResults) {
				resultsRoot.append(
					$('<li>')
						.addClass('list-group-item')
						.append(this.outputResult(displayedResults[i]))
				);
			}
		}

		for(var i in hiddenResults) {
			resultsRoot.append(
				$('<li>')
					.addClass('list-group-item ppp-result-item-hidden')
					.append(this.outputResult(hiddenResults[i]))
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
			.append(this.outputTree(result.tree, result.language));
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
	window.resultBuilder.prototype.outputTree = function(tree, language) {
		switch(tree.type) {
			case 'triple':
				return $('<span>')
					.addClass('label label-default ppp-node ppp-triple')
					.append('(')
					.append(this.outputTree(tree.subject, language))
					.append(',')
					.append(this.outputTree(tree.predicate, language))
					.append(',')
					.append(this.outputTree(tree.object, language))
					.append(')');
			case 'resource':
				return $('<span>')
					.addClass('label label-info ppp-node ppp-resource')
					.append(this.outputResource(tree, language));
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
	window.resultBuilder.prototype.outputResource = function(resource, language) {
		if(!('value-type' in resource)) {
			resource['value-type'] = 'string';
		}

		if(resource['value-type'] in window.resultBuilder.resourceFormatters) {
			return window.resultBuilder.resourceFormatters[resource['value-type']](resource, language);
		} else {
			return $('<span>')
				.text(resource.value);
		}
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputShowHiddenResultsButton = function() {
		var inHidePosition = false;

		return $('<div>')
			.addClass('url-link')
			.append(
				$('<a>')
					.attr('id', 'ppp-button-internalresults')
					.addClass('btn btn-default')
					.text('Show internal results')
					.click(function() {
						if(inHidePosition) {
							$('.ppp-result-item-hidden').hide();
							$('#ppp-button-internalresults').text('Show internal results');
							inHidePosition = false;
						} else {
							$('.ppp-result-item-hidden').show();
							$('#ppp-button-internalresults').text('Hide internal results');
							inHidePosition = true;
						}
					}

				)
			);
	};

} (jQuery, window));
