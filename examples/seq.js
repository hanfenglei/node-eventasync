const EventEmitter = require('events').EventEmitter;
require('./../index');

const ev = new EventEmitter();
ev.data = [];

const listener1 = data =>
  new Promise(res =>
    setTimeout(() => {
      data.push(1);
      res(true);
    }, 400)
  );

const listener2 = data => data.push(2);

const listener3 = data =>
  new Promise(res =>
    setTimeout(() => {
      data.push(3);
      res(true);
    }, 200)
  );

ev.on('event', listener1);
ev.on('event', listener2);
ev.on('event', listener3);

const promise = ev.emitAsyncSeq('event', ev.data);
promise.then(() => {
  ev.data.push(4);
  console.log('data:', ev.data);
}).catch(err => {
  console.log(err);
});
