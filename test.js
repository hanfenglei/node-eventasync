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

const listener1 = data => setTimeout(() =>data.push(1), 400);
const listener2 = data => setTimeout(() =>data.push(2), 200);

test('emit() on async listener works on sync listeners only', t => {
  const server = new Server();
  server.on('event', listener1);
  server.on('event', listener2);
  server.emit('event', server.data);
  server.data.push(3);
  t.same(server.data, [3]);
});

test('emitAsync() run listeners in parallel', t => {
  const server = new Server();
  server.on('event', listener1);
  server.on('event', listener2);
  const promise = server.emitAsync('event', server.data);

  promise.then(() => {
    server.data.push(3);
    t.same(server.data, [2, 1, 3]);
  });
});

test('emitAsyncSeq() run listeners in sequential', t => {
  const server = new Server();
  server.on('event', listener1);
  server.on('event', listener2);
  const promise = server.emitAsyncSeq('event', server.data);
  
  promise.then(() => {
    server.data.push(3);
    t.same(server.data, [1, 2, 3]);
  });
});