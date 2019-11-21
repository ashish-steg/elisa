require([
	"modules/jquery-mozu", 
	"underscore", 
	"hyprlive", 
	"modules/api"
], function (
	$, 
	_, 
	Hypr, 
	api
) {
	$(document).ready(function() {
		/* Controls subnav close when clicking elsewhere on tablets in landscape */
		$('html').click(function() {
			if ($('.mz-sitenav .mz-sitenav-sub').hasClass('show') || $('.mz-sitenav .mz-sitenav-sub-sub').hasClass('show')) {
				$('.mz-sitenav .mz-sitenav-sub').removeClass('show');
				$('.mz-sitenav .mz-sitenav-sub-sub').removeClass('show');
			}
		});
		/* Prevents subnav close on tablets in landscape when clicking on subnav, but not subnav link/toggle */
		$('.mz-sitenav .mz-sitenav-sub').click(function(){
			event.stopPropagation();
		});
		/* Controls subnav open toggles on tablets in landscape */
		$('.mz-sitenav .mz-sitenav-sub-toggle').click(function(){
			$(this).siblings('.mz-sitenav-sub-toggle').children('.mz-sitenav-sub').removeClass('show').find('.mz-sitenav-sub-sub').removeClass('show');
			$(this).children('.mz-sitenav-sub').toggleClass('show');
			event.stopPropagation();
		});
		/* hover then click for mobile */
		$('.mz-sitenav-link.mz-tablet-link').on('click', function (e) {
			e.preventDefault();

			if ($(this).next().css('maxHeight') !== '0px') {
				window.location = $(this).attr('href');
			}
		});

		/* Controls sub-subnav open toggles on tablets in landscape */
		$('.mz-sitenav .mz-sitenav-sub-sub-toggle').click(function(){
			$(this).siblings('.mz-sitenav-sub-sub-toggle').children('.mz-sitenav-sub-sub').removeClass('show');
			$(this).children('.mz-sitenav-sub-sub').toggleClass('show');
			event.stopPropagation();
		});

		/* Adds class to second half of top nav mega menu links */
		var numTopNavLinks = $('#mega-menu .mz-sitenav-list').children('.mz-sitenav-item').length;
		var	halfTopNavLinks = numTopNavLinks/2;
		$('#mega-menu .mz-sitenav-list').children('.mz-sitenav-item').each(function(){
			if ($(this).index() >= halfTopNavLinks) {
				$(this).addClass('mm-float-right');
			}
		});

		/* Mega Menu column number JS */
		var endCol1 = Hypr.getThemeSetting('mm-1-col-end');
		var endCol2 = Hypr.getThemeSetting('mm-2-cols-end');
		var endCol3 = Hypr.getThemeSetting('mm-3-cols-end');
		$('#mega-menu .mz-sitenav-sub').each(function(){
			var numCategories = $(this).find('.mz-sitenav-link').length;
			if (numCategories >= endCol3) {
				$(this).parent('.mz-sitenav-item').addClass('mm-4-cols');
			} else if (numCategories >= endCol2 && numCategories < endCol3) {
				$(this).parent('.mz-sitenav-item').addClass('mm-3-cols');
			} else if (numCategories >= endCol1 && numCategories < endCol2) {
				$(this).parent('.mz-sitenav-item').addClass('mm-2-cols');
			} else if (numCategories < endCol1) {
				$(this).parent('.mz-sitenav-item').addClass('mm-1-col');
			}
		});
		api.request("GET", "/api/commerce/catalog/storefront/categories/tree").then(function(tree){
			$(tree.items).each(function(){
				if(this.content.categoryImages.length > 0){
					var navImg = $("#nav-img-"+ this.categoryId);
					navImg.attr("src", this.content.categoryImages[0].imageUrl);
					navImg.show();
					if(this.content.categoryImages[0].altText){
						navImg.wrap("<a href='"+ this.content.categoryImages[0].altText +"'></a>");
					}
					navImg.load(function(){
						var winWidth = $(window).width();
						var offset = 0;
						$(this).parent().parent().each(function(){
							$(this).css("left", "0");
							offset = winWidth - ($(this).offset().left + $(this).width());
							if(offset < 0){
								$(this).css("left", offset +"px");
							}
						});
					});
				}
			});
		});

		// logout
		$(".mz-utilitynav-link.logout").on('click', function(){
			window.location.href = "/logout";
		});

		// Mega Menu align columns;
		window.realignMenus = function(){
			var winWidth = $(window).width();
			var offset = 0;
			$(".mz-sitenav-sub").each(function(){
				$(this).width("0px");
				$(this).width(this.scrollWidth +"px");
				if(this.scrollHeight > 380){
					$(this).height("380px");
				} else {
					$(this).height(this.scrollHeight +"px");
				}
			});
			$(".mz-sitenav-sub-container").each(function(){
				$(this).css("left", "0");
				offset = winWidth - ($(this).offset().left + $(this).width());
				if(offset < 0){
					$(this).css("left", offset +"px");
				}
			});
		};
		window.realignMenus();
		$(window).resize(function(){
			window.realignMenus();
		});

		// Check if user session expired
		if(!require.mozuData("user").isAnonymous && !require.mozuData("user").isAuthenticated){
			window.alert('Login Session Has Expired');
			window.location.href = "/logout";
		}
	});
});