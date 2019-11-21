define(['modules/jquery-mozu'], function ($) {
	$.getScript('//cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.0.0-beta.3/owl.carousel.min.js', function() {
	    //script is loaded and executed put your dependent JS here
		$(document).ready(function(){
			$('#mz-slideshow.owl-carousel').owlCarousel({
			    autoplay:true,
			    autoplayTimeout:5000,
			    autoplayHoverPause:true,
	            items:1,
			    loop:true,
			    nav:true,
			    responsiveClass:true,
			    responsive:{
			        0:{
			            dots:false
			        },
			        768:{
			            dots:true
			        }
			    }
			});
		});
	});
});