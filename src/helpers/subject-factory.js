'use strict';

exports.get = function() {
  const listeners = {};

  function on(eventType, callback) {
    listeners[eventType] = listeners[eventType] || [];
    listeners[eventType].push(callback);
  }

  function emit(eventType, data) {
    const callbacks = listeners[eventType];
    if(!callbacks) return;
    callbacks.forEach(callback => callback(data));
  }

  return {
    on,
    emit
  };
};
