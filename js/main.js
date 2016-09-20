/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	var api = new window.pppApi(window.config.pppCoreUrl);
	var resultBuilder = new window.resultBuilder();
	var $simpleSerarchResult = $('#simplesearch-result');
	var $questionInput = $('#simplesearch-input-question');
	var currentInput = '';


	function buildUrlForQuestion(languageCode, question) {
		var query = {
			'lang': languageCode,
			'q': question
		};
		return window.location.href.split('#')[0].split('?')[0]  + '?' + $.param(query);
	}

	function getRandomQuestion() {
		var languageCode = $.i18n.lng();

		if(!(languageCode in window.pppQuestions)) {
			return '';
		}

		return window.pppQuestions[languageCode][Math.floor(Math.random() * window.pppQuestions[languageCode].length)];
    }

	function submitQuery(question, shouldSpeak) {
		$questionInput.val(question);
		doQuery(question, shouldSpeak);
	}

	function doQuery(question, shouldSpeak) {
		var input = {"type": "sentence", "value": question};
		currentInput = input;

		$simpleSerarchResult.empty()
			.append(
				$('<div>')
					.addClass('panel panel-default')
					.append(
						$('<div>')
							.addClass('panel-body text-center')
							.append(
								$('<span>')
									.addClass('fa fa-spinner fa-spin')
							)
							.append($.t('result.loading'))
					)
			);

		updateEnvironmentForQuestion(question);

		var measures = {
			'relevance': 0,
			'accuracy': 1
		};
		var requestId = buildId();

		api.sendRequest(
			{
				'language': $.i18n.lng(),
				'id': requestId,
				'tree': input,
				'measures': measures,
				'trace': [
					{
						'module': 'input',
						'tree': input,
						'measures': measures
					}
				]
			},
			function(results) {
				if(input != currentInput) {
					return; //old result
				}
				logResponse(requestId, question, results);

				results = removeDuplicates(explodeList(results));

				$('#simplesearch-result')
					.empty()
					.append(resultBuilder.outputResults(results));
				resultBuilder.onRendered();

				if(shouldSpeak || config.speaking) {
					var resultSpeaker = new window.resultSpeaker(results.language);
					resultSpeaker.speakResults(results);
				}
			},
			function(jqXHR, textStatus) {
				if(input != currentInput) {
					return; //old result
				}

				$('#simplesearch-result')
					.empty()
					.append(resultBuilder.outputError(textStatus));
			}
		);
	}

	function updateEnvironmentForQuestion(question) {
		var url = buildUrlForQuestion($.i18n.lng(), question);
		var title = question + ' — Platypus';

		if('history' in window && typeof window.history.pushState === 'function') {
			window.history.pushState({}, title, url);
		}

		$('link[rel=canonical]').attr('href', url);

		$('title').text(title);
	}

	function explodeList(responses) {
		var exploded = [];
		for(var i in responses) {
			if(responses[i].tree.type === 'list') {
				for(var j in responses[i].tree.list) {
					exploded.push($.extend(
						{},
						responses[i],
						{tree: responses[i].tree.list[j]}
					));
				}
			} else {
				exploded.push(responses[i]);
			}
		}
		return exploded;
	}

	function removeDuplicates(responses) {
		var filtered = [];
		var presentHashs = {};

		for(var i in responses) {
			var hash = JSON.stringify(responses[i].tree);

			if(!(hash in presentHashs)) {
				filtered.push(responses[i]);
				presentHashs[hash] = true;
			}
		}

		return filtered;
	}

	function logResponse(id, question, responses) {
		if(!('pppLoggerUrl' in window.config)) {
			console.log('Logger is not configured');
		}

		$.ajax({
			url: window.config.pppLoggerUrl,
			type: 'POST',
			contentType: 'application/json',
			dataType: 'json',
			data: JSON.stringify({
				'id': id,
				'question': question,
				'responses': responses
			})
		})
		.fail(function(jqXHR, textStatus) {
			console.log('Logging request failed ' + textStatus);
		});
	}

	function buildId() {
		var date = new Date();
		var random = Math.floor(Math.random() * 100);
		return date.getTime() +  '-' + date.getMilliseconds() + '-' + random + '-webui';
	}

	function setupLanguageSwitch() {
		var languageCode = $.i18n.lng();

		$('#navbar-language-switch-label').text();

		if(window.config.allowedLanguages.length < 2) {
			return; //no selector
		}

		var $selector = $('<ul>')
			.addClass('dropdown-menu')
			.attr('role', 'menu');
		$.each(window.config.allowedLanguages, function(_, lang) {
			if(lang !== languageCode) {
				$('<li>')
					.append(
						$('<a>')
							.text($.t('languages.' + lang))
							.click(function() {
								window.location.href = buildUrlForQuestion(lang, '')
							})
					)
					.appendTo($selector);
			}
		});
		var $dropdown = $('<li>')
			.addClass('dropdown')
			.append($('<a>')
				.addClass('dropdown-toggle')
				.attr('data-toggle', 'dropdown')
				.attr('role', 'button')
				.attr('aria-expanded', 'false')
				.text($.t('languages.' + languageCode))
				.append( $('<span>').addClass('caret'))
			).append($selector)
			.appendTo('#navbar-content-collapse ul');
	}

	function setupSimpleForm() {
		var queryQuestion = $.url().param('q');
		if(queryQuestion) {
			submitQuery(queryQuestion, false);
		}

		$('.simplesearch-button-random')
			.attr('title', $.t('simplesearch.randomquestion'))
			.click(function() {
				submitQuery(getRandomQuestion(), false);
			});
		$('.simplesearch-button-submit').attr('title', $.t('simplesearch.search'));
		$('#simplesearch-input-question').attr('placeholder', $.t('simplesearch.enteryourquestion'));
		$('footer').html($.t('footer'));

		$('#simplesearch-form').submit(function(event) {
			event.preventDefault();
			doQuery($questionInput.val(), false);
		});

		var speechInput = new window.speechInput($.i18n.lng());
		speechInput.setupSpeechInput(function(result) {
			submitQuery(result, true);
		});

		setupLanguageSwitch();
	}

	$(function() {
		//Setup i18n
		$.i18n.init({
			detectLngQS: 'lang',
			useCookie: false, //TODO: use cookie + language selector
			fallbackLng: 'en',
			functions: {
				detectLanguage: function() {
					var languageCode = $.i18n.detectLanguage().split("-")[0];

					if(
						$.inArray(languageCode, window.config.allowedLanguages) === -1 &&
						$.url().param('lang') !== languageCode //We allow to force a language using URL
					) {
						return window.config.allowedLanguages[0];
					}

					return languageCode;
				}
			}
		}, function() {
			$('html')
				.attr('lang', $.i18n.lng())
				.i18n();

			//Create form
			setupSimpleForm();
		});

		//Setup MathJax config
		MathJax.Hub.Config({
			MMLorHTML: {
				prefer: {
					Firefox: "MML",
					Safari: "MML"
				}
			}
		});
	});
} (jQuery, window));
