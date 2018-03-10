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
	var randomQuestionCache = {};


	function buildUrlForQuestion(languageCode, question) {
		var query = {
			'lang': languageCode,
			'q': question
		};
		return window.location.href.split('#')[0].split('?')[0]  + '?' + $.param(query);
	}

	function getRandomQuestion() {
		var languageCode = $.i18n.lng();

		if(languageCode in randomQuestionCache) {
			var questions = randomQuestionCache[languageCode];
			return $.Deferred().resolve(
				questions[Math.floor(Math.random() * questions.length)]
			);
		}

		return api.getSampleQuestions(languageCode).then(function (questions) {
			randomQuestionCache[languageCode] = questions;
			return questions[Math.floor(Math.random() * questions.length)];
		});
    }

	function submitQuery(question) {
		$questionInput.val(question);
		doQuery(question);
	}

	function doQuery(question) {
		currentInput = question;

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

		api.ask(question, $.i18n.lng()).then(
			function(results) {
				if (question !== currentInput) {
					return; //old result
				}

				window.jsonld.expand(results, function (error, graph) {
					if (error !== null) {
						console.log('Invalid JSON-LD: ' + error);
						return;
					}

					resultBuilder.outputResults(graph, $('#simplesearch-result').empty());
				});
			},
			function(jqXHR, textStatus) {
				if (question !== currentInput) {
					return; //old result
				}
				resultBuilder.outputError(textStatus, $('#simplesearch-result').empty());
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
		$('<li>')
			.addClass('dropdown')
			.append($('<a>')
				.addClass('dropdown-toggle')
				.attr('data-toggle', 'dropdown')
				.attr('role', 'button')
				.attr('aria-expanded', 'false')
				.text($.t('languages.' + languageCode))
				.append( $('<span>').addClass('caret'))
			).append($selector)
			.appendTo('#navbar-content-collapse ul')
			.attr('title', $.t('simplesearch.switchlanguage'));
	}

	function setupSimpleForm() {
		var queryQuestion = $.url('?q');
		if(queryQuestion) {
			submitQuery(queryQuestion);
		}

		$('.simplesearch-button-random')
			.attr('title', $.t('simplesearch.randomquestion'))
			.click(function() {
				getRandomQuestion().done(submitQuery);
			});

		$('#simplesearch-input-question').attr('placeholder', $.t('simplesearch.enteryourquestion'));
		$('footer').html($.t('footer'));

		$('#simplesearch-form').submit(function (event) {
			event.preventDefault();
			doQuery($questionInput.val());
		});

		var speechInput = new window.speechInput($.i18n.lng());
		speechInput.setupSpeechInput(submitQuery);

		//Help
		var bigSearch = $('.simplesearch-button-submit.hidden-xs');
		if (bigSearch.is(":visible")) {
			bigSearch.attr('title', $.t('simplesearch.search'))
				.tooltip({
					animation: true,
					placement: 'bottom'

				}).tooltip('show');
		}
		var bigRandom = $('.simplesearch-button-random.hidden-xs');
		if (bigRandom.is(":visible")) {
			bigRandom.tooltip({
				animation: true,
				placement: 'bottom'

			}).tooltip('show');
		}

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
						$.url('?lang') !== languageCode //We allow to force a language using URL
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
