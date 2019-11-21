// /*
//   TODO: add timeout so that the views still render if preload takes too long to complete
//
// */
//
// Array.prototype.clean = function(deleteValue) {
//   for(var x = 0; x < this.length; x++) {
//     if(this[x] === deleteValue) {
//       this.splice(x, 1);
//       x -= 1;
//     }
//   }
//   return this;
// };
//
// define(['modules/api', 'modules/jquery-mozu', 'hips/io', 'hips/store'], function(api, $, io, store) {
//
//   var preload = (function preload(subs) {
//     var subscriptions =  [];
//     var config = {
//       registered: {
//         //myaccount: ['segment', 'recentPurchases']
//       },
//       anonymous: {
//
//       },
//       both: {
//         //'search': [{pre: ['location'], req: 'locationStuff'}]
//       },
//       'custom': [
//         /*
//         function(){
//           if(require.mozuData('pagecontext').pageType !== 'category') return null;
//           else return [{pre:['location'], req: 'searchPageStuff'}];
//         }
//         */
//         function() {
//           return ['customer'];
//         }
//       ]
//     };
//     var userIsAnonymous =  require.mozuData('user').isAnonymous;
//     var pathname = 'supercalifragilisticexpialidocious';
//     try {
//       pathname =  window.location.pathname.split('/').clean('')[0];
//     } catch(e){console.log('couldnt read pathname: ' + e);}
//     var requiredResources =  [];
//     var loaded =  false;
//     var data = {};
//     var requests = {
//       customer: function(cb) {
//         io.getCustomer(cb);
//       }
//     };
//
//     function initialize() {
//       requiredResources = config.both.all || [];
//       if(userIsAnonymous) {
//         if('all' in config.anonymous) requiredResources = requiredResources.concat(config.anonymous.all);
//         if(pathname in config.anonymous) requiredResources = requiredResources.concat(config.anonymous[pathname]);
//         if(pathname in config.both) requiredResources = requiredResources.concat(config.both[pathname]);
//       } else {
//         if('all' in config.registered) requiredResources = requiredResources.concat(config.registered.all);
//         if(pathname in config.registered) requiredResources = requiredResources.concat(config.registered[pathname]);
//         if(pathname in config.both) requiredResources = requiredResources.concat(config.both[pathname]);
//       }
//       if('custom' in config && config.custom.length) {
//         config.custom.forEach(function(test) {
//           var resource = test();
//           if(resource) requiredResources = requiredResources.concat(resource);
//         });
//       }
//     }
//
//     function start() {
//       initialize();
//       var length = requiredResources.length;
//       var completeCount =  0;
//       var buildRequest = function(async, resource) {
//         return function() {
//           async(function() {
//             sync(resource);
//             completeCount += 1;
//             if(length === completeCount) done();
//           });
//         };
//       };
//       var sync = (function() {
//         var serial = requiredResources.filter(function(res){return typeof res === 'object';});
//         var loadedResources = [];
//         return function(type, fun) {
//           if(!fun) {
//             loadedResources.push(type);
//           } else {
//             serial.forEach(function(val) {
//               if(val.req === type) val.fun = fun;
//             });
//           }
//           for(var x = serial.length - 1; x >= 0; x--) {
//             var missingRequirement = false;
//             for(var y = serial[x].pre.length - 1; y >= 0; y--) {
//               missingRequirement = loadedResources.indexOf(serial[x].pre[y]) === -1;
//             }
//             if(!missingRequirement && serial[x].fun && typeof serial[x].fun === 'function') {
//               serial.splice(x,1)[0].fun();
//             }
//           }
//         };
//       })();
//       requiredResources.forEach(function(resource) {
//         var async = requests[resource];
//         if(async) {
//           if(typeof async === 'function') {
//             async(function() {
//               sync(resource);
//               completeCount += 1;
//               if(length === completeCount) done();
//             });
//           }
//         } else {
//           if(typeof resource === 'object') {
//             sync(resource.req, buildRequest(requests[resource.req], resource));
//           } else {
//             completeCount += 1;
//             if(length === completeCount) done();
//           }
//         }
//       });
//     }
//
//     function add(key, value) {
//       store.PutDataStore(requests[key], key, value);
//       store[key](function(datStor) {
//         data[key] = datStor;
//       });
//     }
//     function done() {
//       loaded = true;
//       subscriptions.forEach(function(fun) {
//         if(fun && typeof fun === 'function') fun(data);
//       });
//     }
//     var self = {
//       ready: function(fun) {
//         if(loaded) fun(data);
//         else subscriptions.push(fun);
//       }
//     };
//     start();
//     return self;
//   })();
//
//
//   return preload;
//
//   function getQuery() {
//     var result = {};
//     window.location.search.substr(1).split('&').clean('').forEach(function(val) {
//       var tuple = val.split('=');
//       result[tuple[0]] = tuple[1];
//     });
//     return result;
//
//   }
//
//
// });
