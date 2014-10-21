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
		return 'Random question';
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

			//TODO: add a query box an an answser/failure one with hide/show
			var input = inputParser.parse($('#simplesearch-input-question').val());
			api.sendRequest({
				'tree': input,
				'language': $('html').attr('lang'),
				'id': ''
			}, function(results) {
				$('#simplesearch-result').empty().html(resultBuilder.outputResults(input, results));
			}, function() {
				$simpleSerarchResult.empty().append(
					$('<div>')
						.addClass('panel panel-danger')
						.append(
							$('<div>')
								.addClass('panel-heading')
								.text('The request failed')
							)
						.append(
							$('<div>')
								.addClass('panel-body text-center')
								.text('Input triples: ')
								.append(window.resultBuilder.prototype.outputTree(input))
					)
				);
			});
		});

		$('.simplesearch-button-random').click(function() {
			$('#simplesearch-input-question').val(getRandomQuestion());
		});
	}

	$(function() {
		setupSimpleForm();
	});
} (jQuery, window));
