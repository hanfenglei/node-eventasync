# node-eventasync

node.js event emitter monkey patch for supporting asynchronous listeners.

## Install

```bash
$ npm install eventasync
```

## Usage

To use eventasync, just require it like this:

```js
const EventEmitter = require('events').EventEmitter;
require('eventasync');

const ev = new EventEmitter();

ev.emitAsync('event1');
ev.emitAsyncSeq('event2');
```

``emitAsync`` will call the registered listeners in parallel. ``emitAsyncSeq`` will call the registered listeners in sequence.  Both of them will return a ``Promise`` so that caller function can evaluate the result (or error) by using ``Promise`` interface.

For event listeners, if it is an async operation, you need to return a ``Promise`` for that async operation.

``emitAsync`` uses ``Rx.Observable.mergeAll()``, and ``emitAsyncSeq`` uses ``Rx.Observable.concatAll()``.

## Examples

Here's an example for running all listeners in sequence:

```js
const EventEmitter = require('events').EventEmitter;
require('eventasync');

const ev = new EventEmitter();
ev.data = [];

const listener1 = data => {
  return new Promise(res => {
    setTimeout(() => {
      data.push(1);
      res(true);
    }, 400);
  });
}

const listener2 = data => data.push(2);

const listener3 = data => {
  return new Promise(res => {
    setTimeout(() => {
      data.push(3);
      res(true);
    }, 200);
  });
}

ev.on('event', listener1);
ev.on('event', listener2);
ev.on('event', listener3);

const promise = ev.emitAsyncSeq('event', ev.data);
promise.then(() => {
  ev.data.push(4);
  console.log('data:', ev.data);
});
// data: [ 1, 2, 3, 4 ]
```

Here an example for running all listeners in parallel, while one of them throw an error:

```js
const EventEmitter = require('events').EventEmitter;
require('eventasync');

const ev = new EventEmitter();
ev.data = [];

const listener1 = data => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      rej('Something is wrong!');
    }, 400);  
  });
}

const listener2 = data => {
  return new Promise(res => {
    setTimeout(() => {
      data.push(2);
      res(true);
    }, 200);  
  });
}

const listener3 = data => data.push(3);

ev.on('event', listener1);
ev.on('event', listener2);
ev.on('event', listener3);

const promise = ev.emitAsync('event', ev.data);
promise.then(() => {
  ev.data.push(4);
  console.log('data:', ev.data);
}).catch(err => {
  console.log(err, ev.data);
});
// Something is wrong! [ 3, 2 ]
```

## License

MIT. See [LICENSE](./LICENSE).