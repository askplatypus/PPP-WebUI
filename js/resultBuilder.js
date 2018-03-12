/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function ($, window) {
	'use strict';

	/**
	 * Build the output for the results
	 *
	 * @class
	 * @constructor
	 */
	window.resultBuilder = function () {
	};

	window.resultBuilder.externalSites = function (language) {
		var sites = {
			'//www.wikidata.org': {
				'title': 'Wikidata',
				'icon-url': '//www.wikidata.org/static/favicon/wikidata.ico'
			},
			'//g.co/kg': {
				'title': 'Google',
				'icon-class': 'fa fa-google'
			},
			'//www.imdb.com/': {
				'title': 'IMDb',
				'icon-class': 'fa fa-imdb'
			},
			'//www.facebook.com/': {
				'title': 'Facebook',
				'icon-class': 'fa fa-facebook'
			},
			'//www.flickr.com/': {
				'title': 'Flickr',
				'icon-class': 'fa fa-flickr'
			},
			'//foursquare.com/': {
				'title': 'Foursquare',
				'icon-class': 'fa fa-foursquare'
			},
			'//github.com/': {
				'title': 'GitHub',
				'icon-class': 'fa fa-github'
			},
			'//plus.google.com/': {
				'title': 'Google Plus',
				'icon-class': 'fa fa-google-plus'
			},
			'//www.instagram.com/': {
				'title': 'Instagram',
				'icon-class': 'fa fa-instagram'
			},
			'//www.last.fm/': {
				'title': 'Last.fm',
				'icon-class': 'fa fa-lastfm'
			},
			'//www.linkedin.com/': {
				'title': 'SoundCloud',
				'icon-class': 'fa fa-linkedin'
			},
			'//www.quora.com/': {
				'title': 'Quora',
				'icon-class': 'fa fa-quora'
			},
			'//soundcloud.com/': {
				'title': 'SoundCloud',
				'icon-class': 'fa fa-soundcloud'
			},
			'//open.spotify.com/': {
				'title': 'Spotify',
				'icon-class': 'fa fa-spotify'
			},
			'//stackoverflow.com/': {
				'title': 'StackOverflow',
				'icon-class': 'fa fa-stack-overflow'
			},
			'//store.steampowered.com/': {
				'title': 'Steam',
				'icon-class': 'fa fa-steam'
			},
			'//twitter.com/': {
				'title': 'Twitter',
				'icon-class': 'fa fa-twitter'
			},
			'//vine.co/': {
				'title': 'Vine',
				'icon-class': 'fa fa-vine'
			},
			'//www.yelp.com/': {
				'title': 'Yelp',
				'icon-class': 'fa fa-yelp'
			},
			'//www.youtube.com/': {
				'title': 'Youtube',
				'icon-class': 'fa fa-youtube'
			}
		};
		sites['//' + language + '.wikipedia.org/wiki/'] = {
			'title': 'Wikipedia',
			'icon-class': 'fa fa-wikipedia-w'
		};
		return sites;
	};

	/**
	 * Builds a box for the results.
	 *
	 * @param {array} output The results in JSON-LD
	 * @param {jQuery} $container The node to add results to
	 */
	window.resultBuilder.prototype.outputResults = function (output, $container) {
		var results = (new window.JsonLdGraph(output)).getMainResource().getResourcesForProperty('http://www.w3.org/ns/hydra/core#member');
		var panelType = (results.length === 0) ? 'warning' : 'success';

		var title = $('<div>');
		title.append($('<div>').text($.t('result.result')));

		var $panel = this.buildPanel(panelType, title).appendTo($container);
		this.outputResultList(results, $panel);
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.outputResultList = function (results, $container) {
		var $resultsRoot = $('<ul>')
			.addClass('list-group')
			.appendTo($container);

		if (results.length === 0) {
			$resultsRoot.append(
				$('<li>')
					.addClass('list-group-item')
					.text($.t('result.noresult'))
			);
		} else {
			this.displayResourceResults(results, $resultsRoot);
		}
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.displayResourceResults = function (results, $resultsRoot) {
		var map = null;
		var mapElements = [];
		$.each(results, function (_, result) {
			var mainResource = result.getResourcesForProperty('http://schema.org/result')[0];
			var processingContext = {};
			if (result.getResourcesForProperty('http://askplatyp.us/vocab#term').length === 1) {
				processingContext.term = result.getResourcesForProperty('http://askplatyp.us/vocab#term')[0].getValue();
			}
			if (result.getResourcesForProperty('http://askplatyp.us/vocab#conllu').length === 1) {
				processingContext.conllu = result.getResourcesForProperty('http://askplatyp.us/vocab#conllu')[0].getValue();
			}

			if (mainResource.isInstanceOf('http://schema.org/GeoCoordinates')) {
				var latitudes = mainResource.getResourcesForProperty('http://schema.org/latitude');
				var longitudes = mainResource.getResourcesForProperty('http://schema.org/longitude');
				if (latitudes.length > 0 && latitudes[0].hasValue() && longitudes.length > 0 && longitudes[0].hasValue()) {
					if (map === null) {
						var $container = $('<li>')
							.addClass('list-group-item')
							.css('height', '50em')
							.prependTo($resultsRoot);
						map = L.map($container[0], {
							maxZoom: 14,
							minZoom: 2
						});

						L.tileLayer('https://map.askplatyp.us/osm-intl/{z}/{x}/{y}.png', {
							attribution: $.t('result.leaflet.attribution')
						}).addTo(map);
					}

					var marker = L.marker(L.latLng(latitudes[0].getValue(), longitudes[0].getValue()));
					var topicResources = mainResource.getResourcesForReverseProperty('http://schema.org/geo');
					if (topicResources.length > 0) {
						marker.bindPopup(window.resultBuilder.buildCardForJsonLd(topicResources[0], {}).toHtml().html());
					}
					marker.addTo(map);
					mapElements.push(marker);
					map.fitBounds(L.featureGroup(mapElements).getBounds());
				} else {
					window.console.log('Invalid JSON-LD GeoCoordinates.');
				}
			} else { //Card case
				$('<li>').addClass('list-group-item')
					.append(window.resultBuilder.buildCardForJsonLd(mainResource, processingContext).toHtml())
					.appendTo($resultsRoot);
			}
		});

		//We reload MathJax
		MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
	};

	/**
	 * Builds a box for an error.
	 *
	 * @param {string} error Error message.
	 * @param {jQuery} $container
	 */
	window.resultBuilder.prototype.outputError = function (error, $container) {
		this.buildPanel(
			'danger',
			$('<div>').text($.t('result.error'))
		).append(
			$('<div>')
				.addClass('panel-body')
				.text(error)
		).appendTo($container);
	};

	/**
	 * @private
	 */
	window.resultBuilder.prototype.buildPanel = function (type, $title) {
		return $('<div>')
			.addClass('panel panel-' + type)
			.append(
				$('<div>')
					.addClass('panel-heading')
					.append($title)
			);
	};

	/**
	 * A card
	 *
	 * @class
	 * @constructor
	 */
	window.resultBuilder.Card = function ($title, $content, $image, $footer) {
		this.$title = $title;
		this.$content = ($content === undefined) ? null : $content.addClass('card-text');
		this.$image = ($image === undefined) ? null : $image.addClass('card-image');
		this.$footer = ($footer === undefined) ? null : $footer.addClass('card-context');
	};

	/**
	 * @return {jQuery}
	 */
	window.resultBuilder.Card.prototype.toHtml = function () {
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
	 * @param {String[]} processingContext
	 * @return {window.resultBuilder.Card}
	 */
	window.resultBuilder.buildCardForJsonLd = function (mainResource, processingContext) {
		var card;
		if (mainResource.isInstanceOf('http://www.w3.org/2000/01/rdf-schema#Literal')) {
			card = window.resultBuilder.buildBaseCardForJsonLdLiteral(mainResource);
		} else {
			card = window.resultBuilder.buildBaseCardForJsonLdResource(mainResource);
		}

		mainResource.getReverseProperties().forEach(function (property) {
			if (property === 'http://schema.org/about') {
				return;
			}

			var propertyLabel = window.resultBuilder.buildLabelForProperty(property);
			card.$footer = $('<aside>')
				.append(
					window.resultBuilder.buildLabelWithPopupCardForJsonLd(
						mainResource.getResourcesForReverseProperty(property)[0]
					),
					$('<span>').text(', ' + propertyLabel)
				);
		});

		if (card.$footer === null) {
			card.$footer = window.resultBuilder.buildProcessingContextPopupCard(processingContext);
		} else {
			card.$footer.append(window.resultBuilder.buildProcessingContextPopupCard(processingContext));
		}

		return card;
	};

	/**
	 * Builds a user-friendly label for a property
	 * @todo: i18n support
	 *
	 * @param {string} property
	 * @return {string}
	 */
	window.resultBuilder.buildLabelForProperty = function (property) {
		var match = property.match(/^http:\/\/schema\.org\/(.+)$/);

		if (match === null) {
			return '';
		}

		return match[1].replace(/([A-Z])/g, ' $1').toLowerCase();
	};

	/**
	 * Builds a card for a JsonLd resource
	 * @param {window.JsonLdResource} mainResource
	 * @return {window.resultBuilder.Card}
	 */
	window.resultBuilder.buildBaseCardForJsonLdResource = function (mainResource) {
		//Default case
		//Title
		var name = window.resultBuilder.getPropertyAsString(mainResource, 'http://schema.org/name');
		var description = window.resultBuilder.getPropertyAsString(mainResource, 'http://schema.org/description');
		var $label = $('<span>').text(name);
		if (description !== '') {
			$label.attr('title', description);
		}

		//Links
		var $links = [];
		var officialWebsites = mainResource.getResourcesForProperty('http://schema.org/url');
		officialWebsites.forEach(function (officialWebsite) {
			var url = officialWebsite.hasId() ? officialWebsite.getId() : officialWebsite.getValue();
			$links.push(
				$('<a>')
					.attr('href', url)
					.attr('title', $.t('result.official-website'))
					.addClass('card-link-icon fa fa-globe')
			);
		});
		var actions = mainResource.getResourcesForProperty('http://schema.org/potentialAction');
		for (var i in actions) {
			var action = actions[i];
			if (action.isInstanceOf('http://schema.org/ViewAction')) {
				var targets = action.getResourcesForProperty('http://schema.org/target');
				if (targets.length > 0 && targets[0].hasValue()) { //TODO: manage EntryPoint structures
					var target = targets[0].getValue();
					var actionName = window.resultBuilder.getPropertyAsString(action, 'http://schema.org/name');
					var actionIconUrl = '';
					var actionIcons = action.getResourcesForProperty('http://schema.org/image');
					if (actionIcons.length > 0) {
						actionIconUrl = window.resultBuilder.getUrlForImage(actionIcons[0]);
					}

					if (actionIconUrl === '') {
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
		var externalSites = window.resultBuilder.externalSites($.i18n.lng());
		var sameAs = mainResource.getResourcesForProperty('http://schema.org/sameAs');
		if (mainResource.hasId()) {
			sameAs.push(mainResource);
		}
		for (i in sameAs) {
			var link = sameAs[i].hasId() ? sameAs[i].getId() : sameAs[i].getValue();
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

		//Image
		var $image = undefined;
		var images = mainResource.getResourcesForProperty('http://schema.org/image');
		if (images.length > 0) {
			var image = images[0];

			//retrieve image urls
			var imageUrl = window.resultBuilder.getUrlForImage(image);
			if (imageUrl != '') {
				var imageName = window.resultBuilder.getPropertyAsString(image, 'http://schema.org/name');
				var imageDescription = window.resultBuilder.getPropertyAsString(image, 'http://schema.org/description');

				if (image.hasId()) {
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
		if (detailedDescriptions.length === 0) {
			detailedDescriptions = mainResource.getResourcesForReverseProperty('http://schema.org/about');
		}
		if (detailedDescriptions.length > 0) {
			var about = detailedDescriptions[0];
			var text = about.getResourcesForProperty('http://schema.org/articleBody');
			if (text.length === 0) {
				text = about.getResourcesForProperty('http://schema.org/headline');
			}
			if (text.length > 0 && text[0].hasValue()) {
				$text = $('<div>')
					.text(text[0].getValue());

				var authors = about.getResourcesForProperty('http://schema.org/author');
				if (authors.length > 0) {
					var authorName = window.resultBuilder.getPropertyAsString(authors[0], 'http://schema.org/name');
					if (authorName === '') {
						authorName = 'Source';
					}

					$text.append(' ');
					if (about.hasId()) {
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
				} else if (about.hasId()) {
					//We use the ID to find the author
					for (pattern in externalSites) {
						if (about.getId().includes(pattern)) {
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
		if ($text === null) {
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
	 * @return {window.resultBuilder.Card}
	 */
	window.resultBuilder.buildBaseCardForJsonLdLiteral = function (mainResource) {
		var value = mainResource.getResourcesForProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#value');
		if (value.length !== 1) {
			window.console.log('Invalid JSON-LD literal as root node.');
			return;
		}

		return new window.resultBuilder.Card(
			window.resultBuilder.buildHtmlForLiteral(value[0]),
			$('<div>')
		);
	};

	/**
	 * Builds a label with a popup card for a JsonLd resource
	 * @param {window.JsonLdResource} mainResource
	 * @return {window.resultBuilder.Card}
	 */
	window.resultBuilder.buildLabelWithPopupCardForJsonLd = function (mainResource) {
		var name = window.resultBuilder.getPropertyAsString(mainResource, 'http://schema.org/name');
		var popupCard = window.resultBuilder.buildCardForJsonLd(mainResource, {});

		var $label = $('<span>').text(name);
		$label.popover({
			title: popupCard.$title.html(),
			content: $('<div>').append(popupCard.$image, popupCard.$content),
			html: true,
			container: 'body',
			trigger: 'manual'
		})
			.mouseenter(function () {
				$label.popover('show');
				$('.popover').mouseleave(function () {
					$label.popover('hide');
				});
			})
			.mouseleave(function () {
				setTimeout(function () {
					if ($('.popover:hover').length === 0) {
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
	 * @return string
	 */
	window.resultBuilder.getPropertyAsString = function (resource, property) {
		return window.resultBuilder.getAsString(
			window.JsonLdResource.filterBestResourcesForLanguage(
				resource.getResourcesForProperty(property),
				[$.i18n.lng(), null]
			)
		)
	};

	/**
	 * Returns as string the first resource or returns ''
	 * @param {window.JsonLdResource[]} resources
	 * @return string
	 */
	window.resultBuilder.getAsString = function (resources) {
		for (var i in resources) {
			if (resources[i].hasValue()) {
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
	window.resultBuilder.getUrlForImage = function (imageResource) {
		var contentUrls = imageResource.getResourcesForProperty('http://schema.org/contentUrl');

		if ((contentUrls.length > 0 && contentUrls[0].hasId())) {
			return contentUrls[0].getId();
		} else if ((contentUrls.length > 0 && contentUrls[0].hasValue())) {
			return contentUrls[0].getValue();
		} else if (imageResource.hasId()) {
			return imageResource.getId();
		} else {
			return '';
		}
	};

	/**
	 * Returns as string the first resource or returns ''
	 * @param {window.JsonLdResource} literalResource
	 * @return jQuery
	 */
	window.resultBuilder.buildHtmlForLiteral = function (literalResource) {
		if (literalResource.isInstanceOf('http://www.w3.org/2001/XMLSchema#dateTime')) {
			return window.resultBuilder.buildHtmlForDateTime(literalResource.getValue());
		} else if (literalResource.isInstanceOf('http://www.w3.org/2001/XMLSchema#date')) {
			return window.resultBuilder.buildHtmlForDate(literalResource.getValue());
		} else if (literalResource.isInstanceOf('http://www.w3.org/2001/XMLSchema#time')) {
			return window.resultBuilder.buildHtmlForTime(literalResource.getValue());
		} else if (literalResource.isInstanceOf('http://www.w3.org/2001/XMLSchema#anyURI')) {
			return $('<a>').attr('href', literalResource.getValue()).text(literalResource.getValue());
		} else if (
			literalResource.isInstanceOf('http://www.w3.org/2001/XMLSchema#decimal') ||
			literalResource.isInstanceOf('http://www.w3.org/2001/XMLSchema#float') ||
			literalResource.isInstanceOf('http://www.w3.org/2001/XMLSchema#double')
		) {
			return $('<span>').text(Number.parseFloat(literalResource.getValue()).toLocaleString($.i18n.lng()));
		} else if (literalResource.isInstanceOf('http://www.w3.org/2001/XMLSchema#anyURI')) {
			return $('<a>').attr('href', literalResource.getValue()).text(literalResource.getValue());
		} else if (literalResource.isInstanceOf('http://askplatyp.us/vocab#LaTeX')) {
			return $('<span>').append($('<script>').attr('type', 'math/tex').text(literalResource.getValue()));
		} else {
			var node = $('<span>').text(literalResource.getValue());
			if (literalResource.hasLanguage()) {
				node.attr('lang', literalResource.getLanguage());
			}
			return node;
		}
	};

	/**
	 * Returns an HTML <time> node for a date
	 * @param {string} value an ISO Date or DateTime
	 * @return jQuery
	 */
	window.resultBuilder.buildHtmlForDateTime = function (value) {
		var dateObject = new Date(value);
		var formattingOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		var formattedDate = dateObject.toLocaleString($.i18n.lng(), formattingOptions);
		if (formattedDate === 'Invalid Date') {
			formattedDate = value;
		}
		return $('<time>')
			.attr('datetime', value)
			.attr('lang', $.i18n.lng())
			.text(formattedDate);
	};

	/**
	 * Returns an HTML <time> node for a date
	 * @param {string} value an ISO Date or DateTime
	 * @return jQuery
	 */
	window.resultBuilder.buildHtmlForDate = function (value) {
		var dateObject = new Date(value.replace('Z', ''));
		var formattingOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		var formattedDate = dateObject.toLocaleDateString($.i18n.lng(), formattingOptions);
		if (formattedDate === 'Invalid Date') {
			formattedDate = value;
		}
		return $('<time>')
			.attr('datetime', value)
			.attr('lang', $.i18n.lng())
			.text(formattedDate);
	};

	/**
	 * Returns an HTML <time> node for a time
	 * @param {string} value an ISO Time
	 * @return jQuery
	 */
	window.resultBuilder.buildHtmlForTime = function (value) {
		var dateObject = new Date('2000-01-01T' + value);
		var formattedDate = dateObject.toLocaleTimeString($.i18n.lng());
		if (formattedDate === 'Invalid Date') {
			formattedDate = value;
		}
		return $('<time>')
			.attr('datetime', value)
			.attr('lang', $.i18n.lng())
			.text(formattedDate);
	};

	window.resultBuilder.buildProcessingContextPopupCard = function (processingContext) {
		var elements = [];
		if ('term' in processingContext) {
			elements.push(
				$('<dt>').text($.t('result.normal-form')),
				$('<dd>').append($('<pre>').text(processingContext.term))
			);
		}

		var conllu = undefined;
		var conlluKey = undefined;
		if ('conllu' in processingContext) {
			conllu = [];
			conlluKey = Math.round(Math.random() * 100000000000);
			$.each(processingContext.conllu.split('\n'), function (i, line) {
				var parts = line.split('\t');
				conllu.push({
					text: {
						content: parts[1]
						//"beginOffset": 4
					},
					partOfSpeech: {
						tag: parts[3]
					},
					dependencyEdge: {
						headTokenIndex: (parts[7] === 'root') ? i : parts[6] - 1,
						label: (parts[7] === 'root') ? 'ROOT' : parts[7]
					},
					lemma: parts[2]
				});
			});
			elements.push(
				$('<dt>').append($('<a>')
					.attr('href', 'http://universaldependencies.org/format.html')
					.text($.t('result.conllu'))
				),
				$('<dd>').attr('id', 'conllu-' + conlluKey).attr('title', processingContext.conllu)
			);
		}
		if (elements.length === 0) {
			return null;
		}

		var $content = $('<div>').append($('<dl>').append(elements)).hide();
		return $('<aside>').append(
			$('<button>')
				.addClass('btn btn-info')
				.text($.t('result.explain'))
				.css({float: 'right'})
				.click(function () {
					$content.toggle();

					if (conllu !== undefined) {
						(new displaCy('', {
							container: '#conllu-' + conlluKey,
							format: 'google',
							distance: 150
						})).render(conllu);
					}
				}),
			$content
		);
	};

}(jQuery, window));
