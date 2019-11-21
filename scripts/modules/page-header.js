require(["modules/jquery-mozu", "underscore", "hyprlive"], function ($, _, Hypr) {
	$(document).ready(function() {
        // On scroll to bottom of Mobile Nav, hide Mobile Nav
        // $(window).on('scroll', function () {
        //     if ($(window).scrollTop() > Math.abs($(window).height() - $('#push-menu').height()) + 120) {
        //         if($('body').hasClass('push-menu-open')){
        //             $('body').removeClass('push-menu-open');
        //         }
        //     }
        // });

		$('.mz-pageheader #searchbox').click(function(event){
			event.stopPropagation();
		});

        $('#header-login').on('click', function (e) {
            e.preventDefault();
            $('.mz-login-modal-wrapper').show();
        });

        $('#unauthenticated-wishlist').on('click', function (e) {
            e.preventDefault();
            $('input[name="redirect"]').val($('#unauthenticated-wishlist').attr('href'));
            $('.mz-login-modal-wrapper').show();
        });

        $('.close-modal').on('click', function (e) {
            $('.mz-login-modal-wrapper').hide();
        });

        $('#login-modal-signup').on('click', function (e) {
            e.preventDefault();
            $('.mz-login-modal-container').animate({left: '-100%'}, 500);
            $('.mz-register-modal-container').animate({left: '0'}, 500);
        });

        $('#back-to-login').on('click', function (e) {
            e.preventDefault();
            $('.mz-login-modal-container').animate({left: '0'}, 500);
            $('.mz-register-modal-container').animate({left: '100%'}, 500);
        });

        $('#user-logged-in-btn').on('click', function (e) {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
            } else {
                $(this).addClass('active');
            }
            $('.mz-my-account-quick-view').slideToggle();
        });

        $('#user-logged-in-link').on('click', function (e) {
            e.preventDefault();
            if ($('#user-logged-in-btn').hasClass('active')) {
                $('#user-logged-in-btn').removeClass('active');
            } else {
                $('#user-logged-in-btn').addClass('active');
            }
            $('.mz-my-account-quick-view').slideToggle();
        });

        /* newsletter signup */
        $('#mz-bronto-newsletter').on('submit', function (e) {
            e.preventDefault();

            if ($('#mz-newsemail').val() !== '') {
                $('<img src="http://bm5150.com/public/?q=direct_add&fn=Public_DirectAddForm&id=bmhqbcuoxevejgulscaphlotjaddbln&email=' + $('#mz-newsemail').val() + '&createCooke=1" width="0" height="0" border="0" alt>').appendTo('body');
            }

            $(this).hide();

            $('#mz-bronto-signup-success').show();
        });

        /* hide promo slot on homepage if empty */

        var emptyPromo = true;

        for (var i = 1; i < 8; i++) {
            var el = $('.promo.promo-' + i + '.col-xs-12 > div > div > div');
            for(var x = 0; x < el.length; x++){
                if ($(el[x]).html() !== '') {
                    emptyPromo = false;
                }
            }
            
        }

        if (emptyPromo) {
            $('.promos-widget-wrapper').hide();
        }
	});
});
