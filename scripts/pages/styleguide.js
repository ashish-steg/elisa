require(["modules/jquery-mozu", "underscore", "hyprlive"], function ($, _, Hypr) {
	$(document).ready(function() {
		/* Adds styleguide page dependent JS */
		$('html').click(function() {
			$('.styleguide').find('table.icons i.icon').removeClass('primary').next('.icon-details').removeClass('show');
		});
		$('.styleguide').find('table.icons i.icon').click(function(event) {
			if ($(this).next('.icon-details').hasClass('show')) {
				$('table.icons i.icon').removeClass('primary').next('.icon-details').removeClass('show');
		    } else {
				$('table.icons i.icon').removeClass('primary').next('.icon-details').removeClass('show');
		    	$(this).toggleClass('primary').next('.icon-details').toggleClass('show');
		    }
			event.stopPropagation();
		});
		$('.styleguide').find('.icon-details').click(function(event) {
			event.stopPropagation();
		});
	});
});