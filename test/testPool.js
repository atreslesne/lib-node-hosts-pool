'use strict';

const Pool = require('../src/pool');
const assert = require('chai').assert;

describe('Pool', function () {
    it('Constructor tests', () => {
        let pool = new Pool('https://example.com');
        assert.equal(pool.hosts.length, 1);
        assert.equal(pool.hosts[0]['host'], 'example.com');
        assert.equal(pool.hosts[0]['port'], '443');

        pool = new Pool('http://example.com', {
            headers: { 'Accept-Charset': 'utf-8' }
        });
        assert.equal(pool.hosts.length, 1);
        assert.equal(pool.hosts[0]['host'], 'example.com');
        assert.equal(pool.hosts[0]['port'], '80');
        assert.equal(pool.params['headers']['Accept-Charset'], 'utf-8');
    });

    it('Prepare path', () => {
        let pool = new Pool('localhost');
        assert.equal(pool.preparePath('/some/path', {
            f: 'first value',
            s: 'second'
        }), '/some/path?f=first%20value&s=second');
    });
});
