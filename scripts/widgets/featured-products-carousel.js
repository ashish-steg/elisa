define(['modules/jquery-mozu'], function ($) {
  $.getScript('//cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.0.0-beta.3/owl.carousel.min.js', function () {
      //script is loaded and executed put your dependent JS here
    $(document).ready(function(){
      var responsive = {};
      for(var i = 0; i < $("#fp-slider").children().length; i++){
        responsive[(1200/($("#fp-slider").children().length-1))+200*i] = {items: i+1};
      }
      $('#fp-slider.owl-carousel').owlCarousel({
        autoplay:false,
        autoplayTimeout:5000,
        autoplayHoverPause:true,
        loop:true,
        dots:false,
        nav:true,
        responsiveClass:true,
        responsive:responsive
      });
    });
  });
});