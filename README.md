#http-hosts-pool

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
