'use strict';

const util = require('util');
const async = require('async');
const Pool = require('./pool');

/**
 * Класс очереди для массива хостов.
 *
 * @param {array} hosts Массив хостов
 * @constructor
 */
function Queue(hosts) {
    this.hosts = hosts;
    this.index = -1;
    this.limit = 0;
}

Queue.prototype[Symbol.iterator] = function () {
    return {
        next: () => {
            if (this.index == this.hosts.length - 1) {
                this.index = 0;
            } else {
                this.index++;
            }
            if (this.limit++ == this.hosts.length) return { done: true };
            return { value: this.hosts[this.index], done: false };
        }
    };
};

/**
 * Пул, осуществляющий запросы к хостам по очереди.
 *
 * @param {array} hosts Массив хостов
 * @param {object} params Дополнительные параметры
 * @param {number} [params.timeout=10000] Максимальный таймаут запроса
 * @param {object} [params.headers={}] Дополнительные заголовки, добавляемые к каждому запросу
 * @extends Pool
 * @constructor
 */
function HostsQueue(hosts, params) {
    HostsQueue.super_.apply(this, arguments);
    this.hosts = new Queue(this.hosts);
}
util.inherits(HostsQueue, Pool);

/**
 * Метод выполняет запрос к следующему по очереди хосту из списка.
 * При достижении конца списка, индекс сбрасывается на начало.
 * Недоступные хосты пропускаются.
 *
 * @param {string} method Метод запроса
 * @param {string} path Путь запроса
 * @param {object} params Параметры запроса
 * @param {string} [dataType] Тип передаваемых данных: json или application/x-www-form-urlencoded
 * @returns {Promise<string>}
 */
HostsQueue.prototype.request = function (method, path, params, dataType) {
    let lastError = null;
    let lastResponse = null;
    let lastHost = null;

    return new Promise((resolve, reject) => {
        this.hosts.limit = 0;
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
                        lastHost = host;

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
HostsQueue.prototype.get = function (path, params) {
    return this.request('GET', path, params);
};

/**
 * Выполняет POST запрос.
 *
 * @param {string} path Путь запроса
 * @param {object} params Параметры запроса
 * @returns {Promise<string>}
 */
HostsQueue.prototype.post = function (path, params) {
    return this.request('POST', path, params);
};

/**
 * Выполняет POST запрос с отправкой JSON объекта.
 *
 * @param {string} path Путь запроса
 * @param {object} data Объект для отправки в виде JSON
 * @returns {Promise<string>}
 */
HostsQueue.prototype.postJson = function (path, data) {
    return this.request('POST', path, data, 'json');
};

module.exports = HostsQueue;
