#http-hosts-pool

[![Build Status](https://travis-ci.org/atreslesne/lib-node-hosts-pool.svg?branch=master)](https://travis-ci.org/atreslesne/lib-node-hosts-pool)
[![Coverage Status](https://coveralls.io/repos/github/atreslesne/lib-node-hosts-pool/badge.svg?branch=master)](https://coveralls.io/github/atreslesne/lib-node-hosts-pool?branch=master)

[![npm version](https://badge.fury.io/js/http-hosts-pool.svg)](https://badge.fury.io/js/http-hosts-pool)
[![npm](https://img.shields.io/npm/l/express.svg?maxAge=2592000)](https://github.com/atreslesne/lib-node-hosts-pool/blob/master/LICENSE)

##Installation

```
npm install http-hosts-pool --save
```

##Usage

First available host:

```javascript
const Pool = require('http-hosts-pool').FirstAvailableHost;

let pool = new Pool(['example.com', 'https://example.com', 'localhost:9000']);

pool.get('/some/path', {
    q: 'some query value',
    s: 'other value'
}).then(
    result => console.log(result),
    error => console.error(error.message)
);

pool.post('/some/path', {
    f: 'some value',
    s: 'other value'
}).then(
    result => console.log(result),
    error => console.error(error.message)
);

pool.postJson('/some/path', {
    key: "value"
}).then(
    result => console.log(result),
    error => console.error(error.message)
);
```
