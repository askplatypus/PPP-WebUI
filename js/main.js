/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	//Update on install

	var api = new window.pppApi(window.config.pppCoreUrl);
	var resultBuilder = new window.resultBuilder();
	var inputParser = new window.inputParser();
	var $simpleSerarchResult = $('#simplesearch-result');


	function getRandomQuestion() {
		return 'What is the birth date of George Washington?';
	}

	function setupSimpleForm() {
		$('#simplesearch-form').submit(function(event) {
			event.preventDefault();

			$simpleSerarchResult.empty().append(
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

			var input = inputParser.parse($('#simplesearch-input-question').val());
			var measures = {
				'relevance': 0,
				'accuracy': 1
			};
			api.sendRequest(
				{
					'language': $('html').attr('lang'),
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
						.append(resultBuilder.outputQuery(input))
						.append(resultBuilder.outputResults(results));
				}, function(jqXHR, textStatus) {
					$('#simplesearch-result')
						.empty()
						.append(resultBuilder.outputQuery(input))
						.append(resultBuilder.outputError(textStatus));
				}
			);
		});

		$('.simplesearch-button-random').click(function() {
			$('#simplesearch-input-question').val(getRandomQuestion());
		});
	}

	$(function() {
		setupSimpleForm();
	});
} (jQuery, window));
