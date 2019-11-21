define(["modules/jquery-mozu", "underscore", "hyprlive"], function ($, _, Hypr) {
	$(document).ready(function() {
		bindFacetingForm($);
	});
	function bindFacetingForm ($) {
		if(!$) return;
		$('.mobile-facets-toggle').click(function(){
			if ($(this).hasClass('closed')) {
				$(this).removeClass('closed').addClass('open').children('.show-filters').addClass('hidden').siblings('.hide-filters').removeClass('hidden');
				$(this).next('.mz-facetingform').slideDown();
			} else if ($(this).hasClass('top-toggle') && $(this).hasClass('open')) {
				$(this).removeClass('open').addClass('closed').children('.hide-filters').addClass('hidden').siblings('.show-filters').removeClass('hidden');
				$(this).next('.mz-facetingform').slideUp();
			} else if ($(this).hasClass('bottom-toggle')) {
				$(this).parent('.mz-facetingform').slideUp().siblings('.mobile-facets-toggle').removeClass('open').addClass('closed').children('.hide-filters').addClass('hidden').siblings('.show-filters').removeClass('hidden');
			}
		});
	}
	return {
		bindFacetingForm: bindFacetingForm
	};
});
