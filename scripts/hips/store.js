define(['hips/io'], function(io) {
  // if(window.store) return window.store;
  var debug = require.mozuData('pagecontext').isDebugMode,
  noop = function(){};
  var history = [];
  var store = {
    constants: {

    },
    views: {

    },
    log: debugOnly(function(message, source, lineNum, colNum, stack) {
      history.push({message: message, source: source, lineNum: lineNum, colNum: colNum, timeStamp: Date.now(), stack: stack});
      console.log({message: message, source: source, lineNum: lineNum, colNum: colNum, timeStamp: Date.now(), stack: stack});
    }),
    info: debugOnly(function(message, source, lineNum, colNum, stack) {
      history.push({message: message, source: source, lineNum: lineNum, colNum: colNum, timeStamp: Date.now(), stack: stack});
      console.info({message: message, source: source, lineNum: lineNum, colNum: colNum, timeStamp: Date.now(), stack: stack});
    }),
    warn: debugOnly(function(message, source, lineNum, colNum, stack) {
      history.push({message: message, source: source, lineNum: lineNum, colNum: colNum, timeStamp: Date.now(), stack: stack});
      console.warn({message: message, source: source, lineNum: lineNum, colNum: colNum, timeStamp: Date.now(), stack: stack});
    }),
    error: debugOnly(function(message, source, lineNum, colNum, stack) {
      history.push({message: message, source: source, lineNum: lineNum, colNum: colNum, timeStamp: Date.now(), stack: stack});
      console.error({message: message, source: source, lineNum: lineNum, colNum: colNum, timeStamp: Date.now(), stack: stack});
    }),
    'try': function(fun, context) {
      try {
        fun.apply(context || null);
      } catch(e) {
        this.error(e.message, e.source, e.lineNum, e.colNum, e.timeStamp, e.stack);
      }
    },
    history: (function() {
      var historyLogger = function() {
        return history;
      };
      historyLogger.search = function(term) {
        if(!term) return 'no search term';
        if(!term.toLowerCase) return 'cant search with that term';
        return history.sort(function(a, b) {
          var aCount = 0;
          var bCount = 0;
          for(var aKey in a) {
            if(a[aKey] && a.hasOwnProperty(aKey)) {
              var aIntermediate;
              if(typeof a[aKey] === 'object' && !(a[aKey] instanceof Array)) {
                aIntermediate = JSON.stringify(a[aKey]).toLowerCase();
              } else {
                aIntermediate = a[aKey].toString().toLowerCase();
              }
              if(!aIntermediate || !aIntermediate.indexOf) continue;
              if(aIntermediate.indexOf(term.toLowerCase()) >= 0) aCount += 20;
            }
          }
          for(var bKey in b) {
            if(b[bKey] && b.hasOwnProperty(bKey)) {
              var bIntermediate;
              if(typeof b[bKey] === 'object' && !(b[bKey] instanceof Array)) {
                bIntermediate = JSON.stringify(b[bKey]).toLowerCase();
              } else {
                bIntermediate = b[bKey].toString().toLowerCase();
              }
              if(!bIntermediate || !bIntermediate.indexOf) continue;
              if(bIntermediate.indexOf(term.toLowerCase()) >= 0) bCount += 20;
            }
          }
          return aCount > bCount ? -1 : (aCount < bCount ? 1 : 0);
        });
      };
      return historyLogger;
    })(),
    customer: DataStore(io.getCustomer),
    DataStore: DataStore

  };



  // cb get supported only for simplicity
  // expect shouldFire to be a function that determines whether
  // the relevant subscriber should be notified of a data change
  // dataStore(setVal), dataStore(subscribeFn)
  function DataStore(get) {
    var data = null;
    var subscriptions = [];
    var shouldFireList = [];
    var fire = function() {
        subscriptions.forEach(function(sub, dex) {
            sub(data);
        });
    };
    var getData = function(cb) {
      if(!get) return;
      get(function(res) {
        data = res;
        fire();
        if(cb && typeof cb === 'function') cb(data);
      });
    };
    var dataStore = function(val) {
      if(typeof val === 'function') {
        if(data) val(data);
        else {
          subscriptions.push(val);
          return;
        }
      }


      if(val) {
        data = val;
        fire();
      }
      else return data;
    };
    function getVal(keys) {
      if(!keys || typeof keys !== 'string') return 'invalid keys argument';
      keys = keys.split('.');
      var keyLen = keys.length;
      var result;

      for (var i = 0; i < keyLen; i++) {
        if(!result) {
          if(data && typeof data === 'object') result = data[keys[i]];
          else {
            result = null;
            break;
          }
        } else {
          if(result && typeof result === 'object') result = result[keys[i]];
          else {
            result = null;
            break;
          }
        }
      }
      return result;
    }

    dataStore.get = getVal; //store.customer.get('data.id')
    dataStore.update = getData; // query the api again and update the data
    getData();
    return dataStore;
  }



  function debugOnly(fun) {
    if(debug) return fun;
    else return noop;
  }


  if(debug)  {
    window.store = store;
    window.onerror = function(message, source, lineNum, colNum, error) {
      console.log(store.log(message, source, lineNum, colNum));
    };
  }

  return store;
});
