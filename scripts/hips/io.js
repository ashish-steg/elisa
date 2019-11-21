define(['modules/api', 'modules/jquery-mozu'], function(api, $) {
  var apiContext = require.mozuData('apicontext'),
  user = require.mozuData('user'),
  noop = {then: function(win, fail){if(fail)fail();}, always: function(fun){if(fun)fun();}};



  function getApiHeaders(){
    var apiHeaders = api.context.asHeaders();
    if(user && user.accountId)
      apiHeaders['x-vol-accountId'] = user.accountId;
    return apiHeaders;
  }

  return {
    getCustomer: function(cb) {
      if(user.isAnonymous) return cb();
      api.get('customer', user.accountId).then(function(cust) {
        cb(cust);
      });
    },
    getMyStore: function(cb) {
      var store = $.cookie('myStore'),
      cbIsFun = cb && typeof cb === 'function';
      if(store === 'null') store = null;
      if(user && user.isAnonymous) {
        if(store) {
          if(isNaN(store) && cbIsFun){
            cb();
            return;
          }
          api.get('location', { code: store })
          .then(function(store) {
            if(cbIsFun) cb(store);
          });

        } else if(cbIsFun) cb();
      } else {
        api.get('customer', user.accountId).then(function(customer){
          customer.data.attributes.forEach(function(attr) {
            if(attr.fullyQualifiedName === 'tenant~preferred-store') {
              store = attr.values[0];
            }
          });
          if(!store) {
            if(cbIsFun) cb();
            return;
          }
          api.get('location',{code: store})
          .then(function(store) {
            if(cbIsFun) cb(store);
          });
      });
      }
    },
    setMyStore: function(storeId, cb) {
      if(!storeId) return noop;
      $.cookie('myStore', storeId);
      if(!user || user.isAnonymous) {
        if(cb && typeof cb === 'function') cb();
        return;
      }
      api.get('customer', user.accountId).then(function(customer) {
        var FQN = 'tenant~preferred-store';
        api.get('attributedefinition', {attributeFQN: FQN}).then(function(attrDef) {
          customer.update({
            attributes: [
              {
                fullyQualifiedName: FQN,
                attributeDefinitionId: attrDef.data.id,
                values: [storeId.toString()]
              }
            ]
          }).then(function(res) {
            if(cb && typeof cb === 'function') cb(res);
          });
        });
      });
    }
  };

});
