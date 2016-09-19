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

	window.resultBuilder.externalSites = function(language) {
        var sites = {
            '//www.wikidata.org': {
                'title': 'Wikidata',
                'icon-url': 'http://www.wikidata.org/static/favicon/wikidata.ico'
            },
            '//g.co/kg': {
                'title': 'Google',
                'icon-class': 'fa fa-google'
            },
            '//twitter.com/': {
                'title': 'Twitter',
                'icon-class': 'fa fa-twitter'
            },
            '//www.facebook.com/': {
                'title': 'Facebook',
                'icon-class': 'fa fa-facebook'
            },
            '//www.instagram.com/': {
                'title': 'Instagram',
                'icon-class': 'fa fa-instagram'
            },
            '//www.youtube.com/': {
                'title': 'Youtube',
                'icon-class': 'fa fa-youtube'
            },
            '//plus.google.com/': {
                'title': 'Google Plus',
                'icon-class': 'fa fa-google-plus'
            }
        };
        sites['//' + language + '.wikipedia.org/wiki/'] = {
            'title': 'Wikipedia',
            'icon-class': 'fa fa-wikipedia-w'
        };
        return sites;
    };

	window.resultBuilder.resourceFormatters = {

		'string': function(resource) {
			var $node = $('<span>');
			if ('language' in resource && resource.language !== '') {
				$node.attr('lang', resource.language);
			}
			return $node.text(resource.value);
		},

		'math-latex': function(resource) {
			return $('<span>')
				.attr('title', resource.value)
				.append(
					$('<script>')
						.attr('type', 'math/tex')
						.text(resource.latex)
				);
		},

		'resource-jsonld': function(resource, language) {
			return $('<span>').text(resource.value);
		}
	};

	/**
	 * @private
	 */
	window.resultBuilder.onRendered = [
		function() { //reload MathJax
			MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
		},

		function() { //Basic JSON-LD
			var map = null;
			var mapElements = [];

			$('.resource-jsonld').each(function() {
				var $this = $(this);
				var graph = JSON.parse($this.attr('data-jsonld'));
				var language = $this.attr('lang');

				if(graph['@context'] == 'http://schema.org') {
					graph['@context'] = window.location.origin + window.location.pathname + 'schema-context.jsonld';
				}
				window.jsonld.expand(graph, function(error, graph) {
					if(error !== null) {
						console.log('Invalid JSON-LD: ' + error);
						return;
					}

					var mainResource = (new window.JsonLdGraph(graph)).getMainResource();

					if(mainResource.isInstanceOf('http://schema.org/GeoCoordinates')) {
						var latitudes = mainResource.getResourcesForProperty('http://schema.org/latitude');
						var longitudes = mainResource.getResourcesForProperty('http://schema.org/longitude');
						if(latitudes.length > 0 && latitudes[0].hasValue() && longitudes.length > 0 && longitudes[0].hasValue()) {
							if(map === null) {
								$this.css('height', '50em');
								map = L.map($this[0], {
									maxZoom: 14,
									minZoom: 2
								});

								L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
									attribution: $.t('result.leaflet.attribution')
								}).addTo(map);
							} else {
								$this.remove();
							}

							var marker = L.marker(L.latLng(latitudes[0].getValue(), longitudes[0].getValue()));

							var topicResources = mainResource.getResourcesForReverseProperty('http://schema.org/geo');
							if(topicResources.length > 0) {
								marker.bindPopup(window.resultBuilder.buildCardForJsonLd(topicResources[0], language).toHtml().html());
							}

							marker.addTo(map);
							mapElements.push(marker);
							map.fitBounds(L.featureGroup(mapElements).getBounds());
						} else {
							window.console.log('Invalid JSON-LD GeoCoordinates.');
						}
					} else { //Card case
						$this.append(window.resultBuilder.buildCardForJsonLd(mainResource, language).toHtml());
					}
				});
			});
		}
	];

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
				if(results[i].tree.value !== '') {
					displayedResults.push(results[i]);
				}
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
		title.append($('<div>').text($.t('result.result')));

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

		for(var i in hiddenResults) {
			resultsRoot.append(
				$('<li>')
					.addClass('list-group-item ppp-result-item-hidden')
					.append(this.outputResult(hiddenResults[i]))
			);
		}

		if(displayedResults.length === 0) {
			resultsRoot.append(
				$('<li>')
					.addClass('list-group-item')
					.text($.t('result.noresult'))
			);
		} else {
			this.displayResourceResults(displayedResults, resultsRoot);
		}

		return resultsRoot;
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.displayResourceResults = function(results, $resultsRoot) {
		var displayedResultsPerType = this.splitResourceResultsPerType(results);
		for(var type in displayedResultsPerType) {
			switch(type) {
				case 'resource-jsonld':
					this.displayJsonLdResourceResults(displayedResultsPerType[type], $resultsRoot);
					break;
				default:
					this.displayOtherResourceResults(displayedResultsPerType[type], $resultsRoot);
					break;
			}
		}
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.displayJsonLdResourceResults = function(results, $resultsRoot) {
		for(var i in results) {
			var resource = results[i].tree;
			var language = results[i].language;

			$resultsRoot.append(
				$('<li>')
					.addClass('list-group-item resource-jsonld')
					.attr('data-jsonld', JSON.stringify(resource.graph))
					.attr('lang', language)
			);
		}
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.displayOtherResourceResults = function(results, $resultsRoot) {
		for(var i in results) {
			$resultsRoot.append(
				$('<li>')
					.addClass('list-group-item')
					.append(this.outputResource(results[i].tree, results[i].language))
			);
		}
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.splitResourceResultsPerType = function(results) {
		var resultsPerType = {};

		for(var i in results) {
			var type = results[i].tree['value-type'];
			if(type in resultsPerType) {
				resultsPerType[type].push(results[i]);
			} else {
				resultsPerType[type] = [results[i]];
			}
		}

		return resultsPerType;
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
			$('<div>').text($.t('result.error')),
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
				var list = [tree.subject, tree.predicate, tree.object];
				if('inverse-predicate' in tree) {
					list.push(tree['inverse-predicate']);
				}
				return this.outputSequence(
					list,
					'(', ',', ')',
					'label label-default ppp-node ppp-triple',
					language
				);
			case 'list':
				return this.outputSequence(
					tree.list,
					'[', ',', ']',
					'ppp-node ppp-list',
					language
				);
			case 'union':
				return this.outputSequence(
					tree.list,
					'', '∪', '',
					'ppp-node ppp-union',
					language
				);
			case 'intersection':
				return this.outputSequence(
					tree.list,
					'', '∩', '',
					'ppp-node ppp-intersection',
					language
				);
			case 'sort':
				return this.outputSequence(
					[tree.list, tree.predicate],
					'sort(', ',', ')',
					'ppp-node ppp-sort'
				);
			case 'first':
				return this.outputSequence(
					[tree.list],
					'first(', ',', ')',
					'ppp-node ppp-first'
				);
			case 'last':
				return this.outputSequence(
					[tree.list],
					'last(', ',', ')',
					'ppp-node ppp-last'
				);
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
	window.resultBuilder.prototype.outputSequence = function(elements, prefix, middle, suffix, style, language) {
		var $node = $('<span>')
			.addClass(style)
			.append(prefix);
		var elementsLength = elements.length;

		if(elementsLength === 0) {
			return $node.append(suffix);
		}

		$node.append(this.outputTree(elements[0], language));
		for(var i = 1; i < elementsLength; i++) {
			$node
				.append(middle)
				.append(this.outputTree(elements[i], language));
		}

		return $node.append(suffix);
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
					.text($.t('result.showinternalresults'))
					.click(function() {
						if(inHidePosition) {
							$('.ppp-result-item-hidden').hide();
							$('#ppp-button-internalresults').text($.t('result.showinternalresults'));
							inHidePosition = false;
						} else {
							$('.ppp-result-item-hidden').show();
							$('#ppp-button-internalresults').text($.t('result.hideinternalresults'));
							inHidePosition = true;
						}
					}

				)
			);
	};

	/**
	 * Event to execute when results are rendered
	 */
	window.resultBuilder.prototype.onRendered = function() {
		for(var i in window.resultBuilder.onRendered) {
			window.resultBuilder.onRendered[i]();
		}
	};

	/**
	 * A card
	 *
	 * @class
	 * @constructor
	 */
	window.resultBuilder.Card = function($title, $content, $image, $footer) {
		this.$title = $title;
		this.$content = ($content === undefined) ? null : $content.addClass('card-text');
		this.$image = ($image === undefined) ? null : $image.addClass('card-image');
		this.$footer = ($footer === undefined) ? null : $footer.addClass('card-context');
	};

	/**
	 * @return {jQuery}
	 */
	window.resultBuilder.Card.prototype.toHtml = function() {
		return $('<article>')
			.append(
				this.$image,
				$('<h3>').append(this.$title),
				this.$content,
				this.$footer
			);
	};

	/**
	 * Builds a card for a JsonLd resource
	 * @param {window.JsonLdResource} mainResource
	 * @param {string} language
	 * @return {window.resultBuilder.Card}
	 */
	window.resultBuilder.buildCardForJsonLd = function(mainResource, language) {
		var card;
		if (mainResource.isInstanceOf('http://schema.org/DataType')) {
			card = window.resultBuilder.buildBaseCardForJsonLdLiteral(mainResource, language);
		} else {
			card = window.resultBuilder.buildBaseCardForJsonLdResource(mainResource, language);
		}

		mainResource.getReverseProperties().forEach(function(property) {
			if(property === 'http://schema.org/about') {
				return;
			}

			var propertyLabel = window.resultBuilder.buildLabelForProperty(property, language);
			card.$footer = $('<aside>')
				.append(
					window.resultBuilder.buildLabelWithPopupCardForJsonLd(
						mainResource.getResourcesForReverseProperty(property)[0],
						language
					),
					$('<span>').text(', ' + propertyLabel)
				);
		});
		return card;
	};

	/**
	 * Builds a user-friendly label for a property
	 * @todo: i18n support
	 *
	 * @param {string} property
	 * @param {string} language
	 * @return {string}
	 */
	window.resultBuilder.buildLabelForProperty = function(property, language) {
		var match = property.match(/^http:\/\/schema\.org\/(.+)$/);

		if(match === null) {
			return '';
		}

		return match[1].replace(/([A-Z])/g, ' $1').toLowerCase();
	};

	/**
	 * Builds a card for a JsonLd resource
	 * @param {window.JsonLdResource} mainResource
	 * @param {string} language
	 * @return {window.resultBuilder.Card}
	 */
	window.resultBuilder.buildBaseCardForJsonLdResource = function(mainResource, language) {
		//Default case
		//Title
		var name = window.resultBuilder.getPropertyAsString(mainResource, 'http://schema.org/name', [language, null]);
		var description = window.resultBuilder.getPropertyAsString(mainResource, 'http://schema.org/description', [language, null]);
		var $label = $('<span>').text(name);
		if(description !== '') {
			$label.attr('title', description);
		}

		//Links
		var $links = [];
		var actions = mainResource.getResourcesForProperty('http://schema.org/potentialAction');
		for(var i in actions) {
			var action = actions[i];
			if(action.isInstanceOf('http://schema.org/ViewAction')) {
				var targets = action.getResourcesForProperty('http://schema.org/target');
				if(targets.length > 0 && targets[0].hasValue()) { //TODO: manage EntryPoint structures
					var target = targets[0].getValue();
					var actionName = window.resultBuilder.getPropertyAsString(action, 'http://schema.org/name', [language, null]);
					var actionIconUrl = '';
					var actionIcons = action.getResourcesForProperty('http://schema.org/image');
					if(actionIcons.length > 0) {
						actionIconUrl = window.resultBuilder.getUrlForImage(actionIcons[0]);
					}

					if(actionIconUrl === '') {
						$links.push(
							$('<a>')
								.attr('href', target)
								.text(actionName)
						);
					} else {
						$links.push(
							$('<a>')
								.attr('href', target)
								.attr('title', actionName)
								.append(
									$('<img>')
										.addClass('card-link-icon')
										.attr('src', actionIconUrl)
							)
						);
					}
				}
			}
		}
		if($links.length === 0) {
			var externalSites = window.resultBuilder.externalSites(language);
			var sameAs = mainResource.getResourcesForProperty('http://schema.org/sameAs');
			sameAs.push(mainResource);
			for (i in sameAs) {
				var link = sameAs[i].getId();
				for (var pattern in externalSites) {
					if (link.includes(pattern)) {
						var linkParams = externalSites[pattern];
						if (linkParams['icon-class']) {
							$links.push(
								$('<a>')
									.attr('href', link)
									.attr('title', linkParams['title'])
									.addClass('card-link-icon')
									.addClass(linkParams['icon-class'])
							);
						} else {
							$links.push(
								$('<a>')
									.attr('href', link)
									.attr('title', linkParams['title'])
									.append(
										$('<img>')
											.addClass('card-link-icon')
											.attr('src', linkParams['icon-url'])
									)
							);
						}
					}
				}
			}
		}

		//Image
		var $image = undefined;
		var images = mainResource.getResourcesForProperty('http://schema.org/image');
		if(images.length > 0) {
			var image = images[0];

			//retrieve image urls
			var imageUrl = window.resultBuilder.getUrlForImage(image);
			if(imageUrl != '') {
				var imageName = window.resultBuilder.getPropertyAsString(image, 'http://schema.org/name', [language, null]);
				var imageDescription = window.resultBuilder.getPropertyAsString(image, 'http://schema.org/description', [language, null]);

				if(image.hasId()) {
					$image = $('<a>')
						.attr('href', image.getId());
				} else {
					$image = $('<span>');
				}

				$image
					.addClass('card-image')
					.append(
						$('<img>')
							.attr({
								'src': imageUrl,
								'title': imageName,
								'alt': imageDescription
							})
				);
			}
		}

		//Article about the subject
		var $text = null;
		var detailedDescriptions = mainResource.getResourcesForProperty('http://schema.googleapis.com/detailedDescription');
		if(detailedDescriptions.length === 0) {
			detailedDescriptions = mainResource.getResourcesForReverseProperty('http://schema.org/about');
		}
		if(detailedDescriptions.length > 0) {
			var about = detailedDescriptions[0];
			var text = about.getResourcesForProperty('http://schema.org/articleBody');
            if(text.length === 0) {
                text = about.getResourcesForProperty('http://schema.org/headline');
            }
			if(text.length > 0 && text[0].hasValue()) {
				$text = $('<div>')
					.text(text[0].getValue());

				var authors = about.getResourcesForProperty('http://schema.org/author');
				if(authors.length > 0) {
					var authorName = window.resultBuilder.getPropertyAsString(authors[0], 'http://schema.org/name', [language, null]);
					if(authorName === '') {
						authorName = 'Source';
					}

					$text.append(' ');
					if(about.hasId()) {
						$text.append(
							$('<a>')
								.addClass('small')
								.attr('href', about.getId())
								.text(authorName)
						);
					} else {
						$text.append(
							$('<span>')
								.addClass('small')
								.text(authorName)
						);
					}
				} else if(about.hasId()) {
					//We use the ID to find the author
					for(pattern in externalSites) {
						if(about.getId().includes(pattern)) {
                            $text.append(
                                ' ',
                                $('<a>')
                                    .addClass('small')
                                    .attr('href', about.getId())
                                    .text(externalSites[pattern].title)
                            );
						}
					}
				}
			}
		}
		if($text === null) {
			$text = $('<div>').text(description)
		}

		return new window.resultBuilder.Card(
			$('<span>').append($label, $links),
			$text,
			$image
		);
	};

	/**
	 * Builds a card for a JsonLd literal
	 * @param {window.JsonLdResource} mainResource
	 * @param {string} language
	 * @return {window.resultBuilder.Card}
	 */
	window.resultBuilder.buildBaseCardForJsonLdLiteral = function(mainResource, language) {
		var value = mainResource.getResourcesForProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#value');
		if (value.length !== 1) {
			window.console.log('Invalid JSON-LD literal as root node.');
			return;
		}

		return new window.resultBuilder.Card(
			window.resultBuilder.buildHtmlForLiteral(value[0], language),
			$('<div>')
		);
	};

	/**
	 * Builds a label with a popup card for a JsonLd resource
	 * @param {window.JsonLdResource} mainResource
	 * @param {string} language
	 * @return {window.resultBuilder.Card}
	 */
	window.resultBuilder.buildLabelWithPopupCardForJsonLd = function(mainResource, language) {
		var name = window.resultBuilder.getPropertyAsString(mainResource, 'http://schema.org/name', [language, null]);
		var popupCard = window.resultBuilder.buildCardForJsonLd(mainResource, language);

		var $label = $('<span>').text(name);
		$label.popover({
				title: popupCard.$title.html(),
				content: $('<div>').append(popupCard.$image, popupCard.$content),
				html: true,
				container: 'body',
				trigger: 'manual'
			})
			.mouseenter(function() {
				$label.popover('show');
				$('.popover').mouseleave(function() {
					$label.popover('hide');
				});
			})
			.mouseleave(function() {
				setTimeout(function() {
					if($('.popover:hover').length === 0) {
						$label.popover('hide');
					}
				}, 300);
			});
		return $label;
	};

	/**
	 * Returns as string the first resource or returns ''
	 * @param {window.JsonLdResource} resource
	 * @param {string} property
	 * @param {string[]} languages
	 * @return string
	 */
	window.resultBuilder.getPropertyAsString = function(resource, property, languages) {
		return window.resultBuilder.getAsString(
			window.JsonLdResource.filterBestResourcesForLanguage(
				resource.getResourcesForProperty(property),
				languages
			)
		)
	};

	/**
	 * Returns as string the first resource or returns ''
	 * @param {window.JsonLdResource[]} resources
	 * @return string
	 */
	window.resultBuilder.getAsString = function(resources) {
		for(var i in resources) {
			if(resources[i].hasValue()) {
				return resources[i].getValue();
			}
		}

		return '';
	};

	/**
	 * Returns the url of the image or ''
	 * @param {window.JsonLdResource} imageResource
	 * @return string
	 */
	window.resultBuilder.getUrlForImage = function(imageResource) {
		var contentUrls = imageResource.getResourcesForProperty('http://schema.org/contentUrl');

		if((contentUrls.length > 0 && contentUrls[0].hasId())) {
            return contentUrls[0].getId();
        } else if((contentUrls.length > 0 && contentUrls[0].hasValue())) {
            return contentUrls[0].getValue();
		} else if(imageResource.hasId()) {
			return imageResource.getId();
		} else {
			return '';
		}
	};

	/**
	 * Returns as string the first resource or returns ''
	 * @param {window.JsonLdResource} literalResource
	 * @param {string} language
	 * @return jQuery
	 */
	window.resultBuilder.buildHtmlForLiteral = function(literalResource, language) {
		if(literalResource.isInstanceOf('http://schema.org/Date') || literalResource.isInstanceOf('http://schema.org/DateTime')) {
			return window.resultBuilder.buildHtmlForDate(literalResource.getValue(), language);
		} else if(literalResource.isInstanceOf('http://schema.org/Time')) {
			return window.resultBuilder.buildHtmlForTime(literalResource.getValue(), language);
		} else if(literalResource.isInstanceOf('http://schema.org/URL')) {
			return $('<a>').attr('href', literalResource.getValue()).text(literalResource.getValue());
		} else {
			var node = $('<span>').text(literalResource.getValue());
			if(literalResource.hasLanguage()) {
				node.attr('lang', literalResource.getLanguage());
			}
			return node;
		}
	};

	/**
	 * Returns an HTML <time> node for a date
	 * @param {string} value an ISO Date or DateTime
	 * @param {string} language
	 * @return jQuery
	 */
	window.resultBuilder.buildHtmlForDate = function(value, language) {
		var dateObject = new Date(value);
		var formattingOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};

		var formattedDate = '';
		if(value.indexOf('T') === -1) {
			formattedDate = dateObject.toLocaleDateString(language, formattingOptions);
		} else {
			formattedDate = dateObject.toLocaleString(language, formattingOptions);
		}
		if(formattedDate === 'Invalid Date') {
			formattedDate = value;
		}

		return $('<time>')
			.attr('datetime', value)
			.attr('lang', language)
			.text(formattedDate);
	};

	/**
	 * Returns an HTML <time> node for a time
	 * @param {string} value an ISO Time
	 * @param {string} language
	 * @return jQuery
	 */
	window.resultBuilder.buildHtmlForTime = function(value, language) {
		var dateObject = new Date('2000-01-01T' + value);

		var formattedDate = dateObject.toLocaleTimeString(language);
		if(formattedDate === 'Invalid Date') {
			formattedDate = value;
		}

		return $('<time>')
			.attr('datetime', value)
			.attr('lang', language)
			.text(formattedDate);
	};

} (jQuery, window));
