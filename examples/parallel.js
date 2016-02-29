const EventEmitter = require('events').EventEmitter;
require('./../index');

const ev = new EventEmitter();
ev.data = [];

const listener1 = () =>
  new Promise((res, rej) =>
    setTimeout(() => {
      rej('Something is wrong!');
    }, 400)
  );

const listener2 = data =>
  new Promise(res =>
    setTimeout(() => {
      data.push(2);
      res(true);
    }, 200)
  );

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
