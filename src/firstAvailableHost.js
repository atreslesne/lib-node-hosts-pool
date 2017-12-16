'use strict';

const util = require('util');
const async = require('async');
const Pool = require('./pool');

/**
 * Пул, осуществляющий обращение к первому доступному хосту.
 *
 * @param {array} hosts Массив хостов или URL
 * @param {object} params Дополнительные параметры
 * @param {number} [params.timeout=10000] Максимальный таймаут запроса
 * @param {object} [params.headers={}] Дополнительные заголовки, добавляемые к каждому запросу
 * @extends Pool
 * @constructor
 */
function FirstAvailableHost(hosts, params) {
    FirstAvailableHost.super_.apply(this, arguments);
}
util.inherits(FirstAvailableHost, Pool);

/**
 * Метод выполняет запрос к первому доступному хосту из списка.
 *
 * @param {string} method Метод запроса
 * @param {string} path Путь запроса
 * @param {object} params Параметры запроса
 * @param {string} [dataType] Тип передаваемых данных: json или application/x-www-form-urlencoded
 * @returns {Promise<string>}
 */
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

/**
 * Выполняет GET запрос.
 *
 * @param {string} path Путь запроса
 * @param {object} params Параметры запроса
 * @returns {Promise<string>}
 */
FirstAvailableHost.prototype.get = function (path, params) {
    return this.request('GET', path, params);
};

/**
 * Выполняет POST запрос.
 *
 * @param {string} path Путь запроса
 * @param {object} params Параметры запроса
 * @returns {Promise<string>}
 */
FirstAvailableHost.prototype.post = function (path, params) {
    return this.request('POST', path, params);
};

/**
 * Выполняет POST запрос с отправкой JSON объекта.
 *
 * @param {string} path Путь запроса
 * @param {object} data Объект для отправки в виде JSON
 * @returns {Promise<string>}
 */
FirstAvailableHost.prototype.postJson = function (path, data) {
    return this.request('POST', path, data, 'json');
};

module.exports = FirstAvailableHost;
