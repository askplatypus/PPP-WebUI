/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	var url = $.url();
	var languageCode = url.param('lang') ? url.param('lang') : 'en';
	var api = new window.pppApi(window.config.pppCoreUrl);
	var inputParser = new window.inputParser();
	var resultBuilder = new window.resultBuilder();
	var resultSpeaker = new window.resultSpeaker(languageCode);
	var speechInput = new window.speechInput(languageCode);
	var $simpleSerarchResult = $('#simplesearch-result');
	var $questionInput = $('#simplesearch-input-question');
	var currentInput = '';


	function buildUrlForQuestion(question) {
		var query = {
			'lang': languageCode,
			'q': question
		};
		return window.location.href.split('#')[0].split('?')[0]  + '?' + $.param(query);
	}

	function getRandomQuestion() {
		return window.pppQuestions[Math.floor(Math.random() * window.pppQuestions.length)];
    }

	function submitQuery(question, shouldSpeak) {
		$questionInput.val(question);
		doQuery(question, shouldSpeak);
	}

	function doQuery(question, shouldSpeak) {
		var input = inputParser.parse(question);
		currentInput = input;

		$simpleSerarchResult.empty()
			.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, buildUrlForQuestion(question)))
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
							.append(' Loading...')
					)
			);

		var measures = {
			'relevance': 0,
			'accuracy': 1
		};
		var requestId = buildId();

		api.sendRequest(
			{
				'language': languageCode,
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
					.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, buildUrlForQuestion(question)))
					.append(resultBuilder.outputResults(results));

				MathJax.Hub.Queue(['Typeset', MathJax.Hub]); //reload MathJax
				if(shouldSpeak || config.speaking) {
					resultSpeaker.speakResults(results);
				}
			},
			function(jqXHR, textStatus) {
				if(input != currentInput) {
					return; //old result
				}

				$('#simplesearch-result')
					.empty()
					.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, buildUrlForQuestion(question)))
					.append(resultBuilder.outputError(textStatus));
			}
		);
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

	function setupSimpleForm() {
		$questionInput.attr('lang', languageCode);

		var queryQuestion = url.param('q');
		if(queryQuestion) {
			submitQuery(queryQuestion, false);
		}

		$('#simplesearch-form').submit(function(event) {
			event.preventDefault();
			doQuery($questionInput.val(), false);
		});

		$('.simplesearch-button-random').click(function() {
			submitQuery(getRandomQuestion(), false);
		});

		speechInput.setupSpeechInput(function(result) {
			submitQuery(result, true);
		});
	}

	$(function() {
		setupSimpleForm();
	});
} (jQuery, window));
