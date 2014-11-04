/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	var api = new window.pppApi(window.config.pppCoreUrl);
	var resultBuilder = new window.resultBuilder();
	var inputParser = new window.inputParser();
	var $simpleSerarchResult = $('#simplesearch-result');
	var url = $.url();
	var languageCode = url.param('lang') ? url.param('lang') : 'en';


	function getRandomQuestion() {
		return 'What is the birth date of George Washington?';
	}

	function doQuery(question) {
		var input = inputParser.parse(question);

		$simpleSerarchResult.empty()
			.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, question))
			.append(
				$('<div>')
					.addClass('panel panel-default')
					.append(
						$('<div>')
							.addClass('panel-body text-center')
							.append(
								$('<span>')
									.addClass('glyphicon glyphicon-refresh glyphicon-refresh-animate')
							)
							.append(' Loading...')
					)
		);
		
		var measures = {
			'relevance': 0,
			'accuracy': 1
		};
		api.sendRequest(
			{
				'language': languageCode,
				'id': (new Date()).getTime() + '-' + 'webui',
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
				$('#simplesearch-result')
					.empty()
					.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, question))
					.append(resultBuilder.outputResults(results));
			}, function(jqXHR, textStatus) {
				$('#simplesearch-result')
					.empty()
					.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, question))
					.append(resultBuilder.outputError(textStatus));
			}
		);
	}

	function setupSimpleForm() {
		var queryQuestion = url.param('q');
		if(queryQuestion) {
			$('#simplesearch-input-question').val(queryQuestion);
			doQuery(queryQuestion);
		}

		$('#simplesearch-form').submit(function(event) {
			event.preventDefault();
			doQuery($('#simplesearch-input-question').val());
		});

		$('.simplesearch-button-random').click(function() {
			$('#simplesearch-input-question').val(getRandomQuestion());
		});
	}

	$(function() {
		setupSimpleForm();
	});
} (jQuery, window));
