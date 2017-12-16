'use strict';

const assert = require('chai').assert;
const async = require('async');
const Pool = require('../index').HostsQueue;
const mock = require('./mockServer');

describe('Hosts queue', function() {
    this.timeout(30000);
    let servers = [];

    before((done) => {
        async.each([[9010, 30000, ['500', '404']], [9011, 0, ['404']]], (args, callback) => {
            mock.call(this, ...args).then(server => {
                servers.push(server);
                callback();
            });
        }, done);
    });

    after(done => {
        async.each(servers, (server, callback) => {
            server.close(callback)
        }, done);
    });

    it('Перебор не должен быть бесконечным', () => {
        let pool = new Pool(['localhost:9100', 'localhost:9101']);

        return pool.get('/plain').then(
            result => assert.equal(true, false),
            error => {
                assert.equal(error.message, 'connect ECONNREFUSED 127.0.0.1:9101')
            }
        );
    });

    it('Пропуск недоступного хоста', () => {
        let pool = new Pool(['localhost:9012', 'localhost:9010', 'localhost:9011']);
        return pool.get('/plain').then(result => {
            assert.equal(result, 'host:9010');
        });
    });

    it('Работоспособность очереди', (done) => {
        let pool = new Pool(['localhost:9012', 'localhost:9010', 'localhost:9011']);
        pool.get('/plain').then(result => {
            assert.equal(result, 'host:9010');
            pool.get('/plain').then(result => {
                assert.equal(result, 'host:9011');
                pool.get('/plain').then(result => {
                    assert.equal(result, 'host:9010');
                    done();
                });
            });
        });
    });

    it('Пропуск на ошибке', () => {
        let pool = new Pool(['localhost:9010', 'localhost:9011']);
        return pool.get('/err500').then(result => {
            assert.equal(result, 'host:9011');
        });
    });

    it('POST запрос', () => {
        let pool = new Pool('localhost:9010');
        return pool.post('/post', { a: 'some value' }).then(result => {
            assert.equal(result, 'host:9010:a=some%20value');
        });
    });

    it('POST JSON запрос', () => {
        let pool = new Pool('localhost:9010');
        return pool.postJson('/post/json', { a: 'some value' }).then(result => {
            assert.equal(result, 'host:9010:{"a":"some value"}');
        });
    });

    it('Пропуск по таймауту', () => {
        let pool = new Pool(['localhost:9010', 'localhost:9011'], {
            timeout: 2000
        });
        return pool.get('/timeout').then(result => {
            assert.equal(result, 'host:9011');
        });
    });
});
