'use strict';

const URL = require('url');
const http = require('http');
const https = require('https');
const querystring = require('querystring');
const async = require('async');

function Pool(hosts, params) {
    if (typeof hosts === 'string') hosts = [hosts];
    this.hosts = hosts.map(host => {
        if (host.substr(0, 4) === 'http') {
            return URL.parse(host);
        } else {
            return URL.parse('http://' + host);
        }
    }).map(url => {
        return {
            protocol: (url['protocol'] === 'https:') ? https : http,
            host: url['hostname'],
            port: url['port'] || (url['protocol'] === 'http:' ? 80 : 443),
            auth: url['auth']
        };
    });

    this.params = {
        timeout: 10000,
        headers: {}
    };
    if (params && typeof params === 'object') {
        if (params.timeout) this.params['timeout'] = params.timeout;
        if (params.headers) this.params['headers'] = params.headers;
    }
}

Pool.prototype.preparePath = function (path, params) {
    if (params && typeof params === 'object') {
        return path + '?' + Object.keys(params).map(value => value + '=' + encodeURIComponent(params[value])).join('&');
    }
    return path;
};

Pool.prototype.prepareRequest = function (method, host, path, params, dataType) {
    let req = {
        hostname: host['host'],
        port: parseInt(host['port']),
        method: method,
        headers: {}
    };

    let data = null;
    if (method === 'POST') {
        req.path = path;
        /* istanbul ignore else */
        if (params) {
            if (dataType === 'json') {
                data = JSON.stringify(params);
                req.headers = {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                };
            } else {
                data = querystring.stringify(params);
                req.headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': data.length
                };
            }
        }
    } else {
        req.path = this.preparePath(path, params);
    }

    for (let key in this.params['headers']) {
        req.headers[key] = this.params['headers'][key];
    }

    return {
        request: req,
        data: data,
        protocol: host['protocol']
    };
};

module.exports = Pool;
