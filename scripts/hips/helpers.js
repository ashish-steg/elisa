define(['modules/jquery-mozu', 'underscore'], function($, _) {
  var getPosition = function(cb) {
    var position = window.sessionStorage.getItem('geolocation');
    var done = false;
    if(position) position = JSON.parse(position);
    if(!position) {
      setTimeout(function() {
        if(!done) cb(null);
      }, 10030);
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
          var temp = {coords:{}};
          for(var x in pos.coords) temp.coords[x] = pos.coords[x];
          window.sessionStorage.setItem('geolocation', JSON.stringify(temp));
          done = true;
          cb(pos);
        }, function() {
          done = true;
          cb(null);
        },{
          timeout: 10000
        });
      } else  {
        done = true;
        cb(null);
      }
    } else {
      done = true;
      cb(position);
    }
  };
  return {
    getPosition: getPosition,
    Parallel: function(length, finished) {
      var count = 0;
      var validFinish = finished && typeof finished === 'function';
      return function(ajax, then) {
        if(ajax && typeof ajax.then === 'function') {
          ajax.then(function(res) {
            count += 1;
            if(typeof then === 'function')then.call(this, res);
            if(length === count && validFinish) finished.call(this);
          }, function(res) {
            count += 1;
            if(length === count && validFinish) finished.call(this);
          });
        } else {
          count += 1;
          if(length === count && validFinish) finished.call(this);
        }
      }.bind(this);
    },

    getDirections: function(e) {
      e.preventDefault();
      getPosition(function(pos) {
        var coords = {lat: pos.coords.latitude, lng: pos.coords.longitude};
        var start = '';
        if(coords && coords.lat && coords.lng) {
          start = 'saddr=' + coords.lat + ',' + coords.lng;
        }
        var dest = this.geo ? this.geo : '';
        if(!dest) return false;
        window.open('https://maps.google.com?' + start + '&daddr=' + dest.lat + ',' + dest.lng , '_blank');

      }.bind(this));

    },
    getCreditCardType: function(ccNumber){
      var result;
      if (/^5[1-5]/.test(ccNumber)) {
          //mastercard
          result = "MC";
      }
      else if (/^4/.test(ccNumber)) {
          //visa
          result = "VISA";
      }
      else if (/^3[47]/.test(ccNumber)) {
          //american express
          result = "AMEX";
      }
      else if(/^(6011|65)/.test(ccNumber)){
          result = "DISCOVER";
      }
      return result;
    },
    printDiv: function(elemIdentifier, barcode) {
      var $divToPrint = $(elemIdentifier);
      var newWindow = window.open();
      newWindow.document.write($divToPrint.html());
      newWindow.document.close();
      newWindow.focus();
      newWindow.print();
      newWindow.close();
    }
  };
});
