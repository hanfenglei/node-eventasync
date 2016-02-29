'use strict';

// this code is derived from original event.js of nodejs.

const EventEmitter = require('events').EventEmitter;
const Rx = require('rx');

/**
 * Handle error event, if there is no 'error' event listener then throw.
 *
 * @param domain
 * @returns {boolean}
 * @private
 */
function handleError(domain) {
  let er = arguments[1];
  if (domain) {
    if (!er) er = new Error('Uncaught, unspecified "error" event.');
    er.domainEmitter = this;
    er.domain = domain;
    er.domainThrown = false;
    domain.emit('error', er);
  } else if (er instanceof Error) {
    throw er; // Unhandled 'error' event
  } else {
    // At least give some kind of context to the user
    const err = new Error(`Uncaught, unspecified "error" event. (${er})`);
    err.context = er;
    throw err;
  }
  return false;
}

/**
 * generate event async function for sequential and parallel use cases
 *
 * @param sequential {boolean} true for sequential execution of listener. Default is false.
 * @returns {function}
 */
function emitAsyncGen(sequential) {
  /**
   * Monkey patch on event emitter so that it can work with async handler
   *
   * @param type {string} event type, used for object.on('').
   * @returns {Promise}
   */
  return function emitAsync(type) {
    const self = this;
    return new Promise((res, rej) => {
      let needDomainExit = false;
      let doError = (type === 'error');

      const events = self._events;
      if (events) doError = (doError && events.error === null);
      else if (!doError) return res(false);

      const domain = self.domain;

      try {
        if (doError) return res(handleError(domain));
      } catch (e) {
        rej(e);
      }

      let handlers = events[type];

      if (!handlers) return res(false);

      if (domain && self !== process) {
        domain.enter();
        needDomainExit = true;
      }

      const isFn = typeof handlers === 'function';
      const args = Array.prototype.slice.call(arguments, 1);

      if (isFn) handlers = [handlers];
      const mode = sequential ? 'concatAll' : 'mergeAll';
      Rx.Observable.from(handlers)
        .map(handler =>
          new Rx.Observable.create(observer => {
            let result;
            try {
              result = handler.apply(self, args);
            } catch (e) {
              result = new Promise((_res, _rej) => _rej(e));
            }

            if (result instanceof Promise) {
              result.then(data => {
                observer.onNext(data);
                observer.onCompleted();
              }).catch(err => observer.onError(err));
            } else {
              observer.onNext(true);
              observer.onCompleted();
            }
          })
        )[mode]()
        .toArray()
        .subscribe(
          () => null,
          err => rej(err),
          () => {
            if (needDomainExit) domain.exit();
            res(true);
          }
        );
    });
  };
}

EventEmitter.prototype.emitAsync = emitAsyncGen(false);
EventEmitter.prototype.emitAsyncSeq = emitAsyncGen(true);
