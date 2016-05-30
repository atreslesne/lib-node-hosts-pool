'use strict';

const util = require('util');
const async = require('async');
const Pool = require('./pool');

function FirstAvailableHost(hosts, params) {
    FirstAvailableHost.super_.apply(this, arguments);
}
util.inherits(FirstAvailableHost, Pool);

FirstAvailableHost.prototype.request = function (method, path, params, dataType) {
    let lastError = null;
    let lastResponse = null;

    return new Promise((resolve, reject) => {
        async.someSeries(this.hosts, (host, callback) => {
            let r = this.prepareRequest(method, host, path, params, dataType);
            let req = r['protocol'].request(r.request, (response) => {
                let message = '';
                response.on('data', chunk => message += chunk);
                response.on('end', () => {
                    if (response.statusCode >= 400) {
                        lastError = new Error(`${response.statusCode}: ${response.statusMessage}`);
                        callback(false);
                    } else {
                        lastResponse = message;
                        callback(true);
                    }
                });
            });

            req.on('error', (err) => {
                lastError = err;
                callback(false);
            });
            req.on('socket', (socket) => {
                socket.setTimeout(this.params.timeout);
                socket.on('timeout', () => {
                    req.abort();
                });
            });
            if (r['data']) req.write(r['data']);
            req.end();
        }, result => result ? resolve(lastResponse) : reject(lastError));
    });
};

FirstAvailableHost.prototype.get = function (path, params) {
    return this.request('GET', path, params);
};

FirstAvailableHost.prototype.post = function (path, params) {
    return this.request('POST', path, params);
};

FirstAvailableHost.prototype.postJson = function (path, data) {
    return this.request('POST', path, data, 'json');
};

module.exports = FirstAvailableHost;
