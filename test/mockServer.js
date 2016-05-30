'use strict';

const http = require('http');
const url = require('url');

module.exports = function (port, timeout, errors) {
    return new Promise((resolve, reject) => {
        let server = http.createServer((req, res) => {
            let parsed = url.parse(req.url, true);

            if (parsed.pathname == '/plain') {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Cache-Control', 'private, max-age=0');
                res.end(`host:${port}`);
            }

            if (parsed.pathname == '/timeout') {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Cache-Control', 'private, max-age=0');
                if (timeout) {
                    setTimeout(() => res.end(), timeout);
                } else {
                    res.end(`host:${port}`);
                }
            }

            if (parsed.pathname == '/err500') {
                if (errors && errors.includes('500')) {
                    res.statusCode = 500;
                    res.statusMessage = 'Internal server error';
                    res.end('Internal server error');
                } else {
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.setHeader('Cache-Control', 'private, max-age=0');
                    res.end(`host:${port}`);
                }
            }

            if (parsed.pathname == '/err404') {
                if (errors && errors.includes('404')) {
                    res.statusCode = 404;
                    res.statusMessage = 'Not Found';
                    res.end('Not Found');
                } else {
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.setHeader('Cache-Control', 'private, max-age=0');
                    res.end(`host:${port}`);
                }
            }

            if (parsed.pathname == '/auth') {
                if (req.headers['authorization'] !== 'Basic dGVzdDpwYXNz') {
                    res.statusCode = 401;
                    res.statusMessage = 'Unauthorized';
                    res.end('Unauthorized');
                } else {
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.setHeader('Cache-Control', 'private, max-age=0');
                    res.end(`host:${port}`);
                }
            }

            if (parsed.pathname == '/post') {
                let body = '';
                req.on('data', (data) => body += data);
                req.on('end', () => {
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.setHeader('Cache-Control', 'private, max-age=0');
                    res.end(`host:${port}:${body}`);
                });
            }

            if (parsed.pathname == '/post/json') {
                let body = '';
                req.on('data', (data) => body += data);
                req.on('end', () => {
                    let j = JSON.parse(body);
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.setHeader('Cache-Control', 'private, max-age=0');
                    res.end(`host:${port}:${JSON.stringify(j)}`);
                });
            }
        });

        server.listen(port, () => resolve(server));
    });
};
