'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = createMiddleware;
var decycle = exports.decycle = function decycle(obj) {
  var cache = [];

  var stringified = JSON.stringify(obj, function (key, value) {
    if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        return;
      }
      cache.push(value);
    }
    return value;
  });
  cache = null;

  return stringified;
};

var setToValue = exports.setToValue = function setToValue(obj, value, path) {
  if (!obj || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') {
    return;
  }
  path = path.split('.');
  var tmp = obj;
  for (var i = 0, len = path.length; i < len - 1; i++) {
    obj = Object.assign({}, obj[path[i]]);
    tmp[path[i]] = obj;
    tmp = obj;
  }
  obj[path[i]] = value;
};

var sanitize = exports.sanitize = function sanitize(keyPaths, state) {
  if (typeof keyPaths === 'function') {
    return keyPaths(state);
  }

  var replacement = '********';
  var updatedState = Object.assign({}, state);
  for (var i = 0, len = keyPaths.length; i < len; i++) {
    setToValue(updatedState, replacement, keyPaths[i]);
  }
  return updatedState;
};

var isError = function isError(action) {
  return action.error === true;
};

function createMiddleware(Rollbar, keyPaths) {
  return function (store) {
    return function (next) {
      return function (action) {
        if (!isError(action)) {
          return next(action);
        }

        var stateToSend = store.getState();
        if (keyPaths) {
          stateToSend = sanitize(keyPaths, stateToSend);
        }

        var decycledState = decycle(stateToSend);

        Rollbar.error(action.payload, {
          state: decycledState
        });

        return next(action);
      };
    };
  };
}
