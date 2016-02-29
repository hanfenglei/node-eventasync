'use strict';

const EventEmitter = require('events').EventEmitter;
require('./index');

const test = require('ava').test;

class Server extends EventEmitter {
  constructor() {
    super();
    this.data = [];
  }
}

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

test('emit() on async listener works on sync listeners only', t => {
  const server = new Server();
  server.on('event', listener1);
  server.on('event', listener2);
  server.on('event', listener3);
  server.emit('event', server.data);
  server.data.push(4);
  t.same(server.data, [2, 4]);
});

test('emitAsync() run listeners in parallel', t => {
  const server = new Server();
  server.on('event', listener1);
  server.on('event', listener2);
  server.on('event', listener3);
  const promise = server.emitAsync('event', server.data);

  promise.then(() => {
    server.data.push(4);
    t.same(server.data, [2, 3, 1, 4]);
  });
});

test('emitAsyncSeq() run listeners in sequential', t => {
  const server = new Server();
  server.on('event', listener1);
  server.on('event', listener2);
  server.on('event', listener3);
  const promise = server.emitAsyncSeq('event', server.data);

  promise.then(() => {
    server.data.push(4);
    t.same(server.data, [1, 2, 3, 4]);
  });
});
