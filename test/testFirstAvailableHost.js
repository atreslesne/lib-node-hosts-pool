'use strict';

const assert = require('chai').assert;

const http = require('http');
const async = require('async');
const Pool = require('../index').FirstAvailableHost;
const mock = require('./mockServer');

describe('First available host', function() {
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

    it('Skip not available host', () => {
        let pool = new Pool(['localhost:9012', 'localhost:9010', 'localhost:9011']);

        return pool.get('/plain').then(result => {
            assert.equal(result, 'host:9010');
        });
    });

    it('Skip on timeout', () => {
        let pool = new Pool(['localhost:9010', 'localhost:9011'], {
            timeout: 2000
        });

        return pool.get('/timeout').then(result => {
            assert.equal(result, 'host:9011');
        });
    });

    it('Skip on error', () => {
        let pool = new Pool(['localhost:9010', 'localhost:9011']);

        return pool.get('/err500').then(result => {
            assert.equal(result, 'host:9011');
        });
    });

    it('All hosts error', () => {
        let pool = new Pool(['localhost:9010', 'localhost:9011']);

        return pool.get('/err404').then(
            result => assert.equal(true, false),
            error => {
                assert.equal(error.message, '404: Not Found')
            }
        );
    });

    it('Auth request', () => {
        let pool = new Pool('localhost:9010', {
            headers: { 'Authorization': 'Basic dGVzdDpwYXNz' }
        });

        return pool.get('/auth').then(result => {
            assert.equal(result, 'host:9010');
        });
    });

    it('Post request', () => {
        let pool = new Pool('localhost:9010');

        return pool.post('/post', { a: 'some value' }).then(result => {
            assert.equal(result, 'host:9010:a=some%20value');
        });
    });

    it('Post JSON request', () => {
        let pool = new Pool('localhost:9010');

        return pool.postJson('/post/json', { a: 'some value' }).then(result => {
            assert.equal(result, 'host:9010:{"a":"some value"}');
        });
    });
});
