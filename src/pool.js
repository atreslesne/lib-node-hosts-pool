'use strict';

const URL = require('url');
const http = require('http');
const https = require('https');
const querystring = require('querystring');
const async = require('async');

/**
 * Базовый класс для реализации пулов.
 *
 * @param {array} hosts Массив хостов
 * @param {object} params Дополнительные параметры
 * @param {number} [params.timeout=10000] Максимальный таймаут запроса
 * @param {object} [params.headers={}] Дополнительные заголовки, добавляемые к каждому запросу
 * @constructor
 */
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

/**
 * Метод подготавливает путь запроса.
 *
 * @param {string} path Базовый путь
 * @param {object} params Параметры запроса
 * @returns {string}
 */
Pool.prototype.preparePath = function (path, params) {
    if (params && typeof params === 'object') {
        return path + '?' + Object.keys(params).map(value => value + '=' + encodeURIComponent(params[value])).join('&');
    }
    return path;
};

/**
 * Метод подготавливает запрос.
 *
 * @param {string} method Метод запроса
 * @param {string} host Хост
 * @param {string} path Путь запроса
 * @param {object} params Параметры запроса
 * @param {string} dataType Тип передаваемых данных: json или application/x-www-form-urlencoded
 * @returns {{request: {hostname: string, port: number, method: string, headers: {}}, data: string, protocol: string}}
 */
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
