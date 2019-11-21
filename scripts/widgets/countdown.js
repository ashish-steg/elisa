define(['modules/jquery-mozu'],
    function($) {



		function getTimeRemaining(endtime) {
		  var t = Date.parse($('.countdown-date').text()) - Date.parse(new Date());
		  var seconds = Math.floor((t / 1000) % 60);
		  var minutes = Math.floor((t / 1000 / 60) % 60);
		  var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
		  var days = Math.floor(t / (1000 * 60 * 60 * 24));
		  return {
		    'total': t,
		    'days': days,
		    'hours': hours,
		    'minutes': minutes,
		    'seconds': seconds
		  };
		}

		function initializeClock(id, endtime) {
		  var clock = $('#countdown');
		  var daysSpan = clock.find('.days');
		  var hoursSpan = clock.find('.hours');
		  var minutesSpan = clock.find('.minutes');
		  var secondsSpan = clock.find('.seconds');

		  function updateClock() {
		    var t = getTimeRemaining(endtime);


		    if (t.total <= 0) {
		    	daysSpan.text(0);
		    	hoursSpan.text(0);
		    	minutesSpan.text(0);
		    	secondsSpan.text(0);
		    } else {
			    daysSpan.text(t.days);
			    hoursSpan.text(('0' + t.hours).slice(-2));
			    minutesSpan.text(('0' + t.minutes).slice(-2));
			    secondsSpan.text(('0' + t.seconds).slice(-2));
		    }
		  }

		  updateClock();
		  var timeinterval = setInterval(updateClock, 1000);
		}


		var deadline = new Date(Date.parse(new Date()) + 15 * 24 * 60 * 60 * 1000);
		initializeClock('clockdiv', deadline);



    }
);