
# Node Cookie

![](http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png)

![](https://img.shields.io/travis/poppinss/node-cookie.svg)
[![Coverage Status](https://coveralls.io/repos/poppinss/node-cookie/badge.svg?branch=master&service=github)](https://coveralls.io/github/poppinss/node-cookie?branch=master)

`node-cookie` is a standalone I/O module for reading and writing cookies on http request.
Out of the box it has support for

1. signed cookies.
2. encrypted cookies.

## See also

1. node-req
2. node-res

## Basic Setup

```javascript
const http = require('http')
const nodeCookie = require('node-cookie')

http.createServer(function (req, res) {

  // this will update set-cookie header on res object.
  nodeCookie.create(req, res, 'user', 'virk')

}).listen(3000)
```

## Signing cookies with a secret

```javascript
const http = require('http')
const nodeCookie = require('node-cookie')

http.createServer(function (req, res) {

  nodeCookie.create(req, res, 'user', 'virk', 'secret')

}).listen(3000)
```

## Signing & encrypting cookies with a secret

```javascript
const http = require('http')
const nodeCookie = require('node-cookie')

http.createServer(function (req, res) {

  nodeCookie.create(req, res, 'user', 'virk', 'secret', true)

}).listen(3000)
```

## Methods

#### create (req, res, key, value, secret=null?, encryptCookie=false?)

```javascript
nodeCookie.create(req, res, 'somekey', 'somevalue', 'yoursecret', true)
```

#### clear (req, res, key)

remove existing cookie from http request

```javascript
nodeCookie.clear(req, res, 'somekey')
```

#### parse (req, secret=null?,decryptCookie=false?)

parse cookies from request. Note - nodeCookie can only decrypt and unsign cookies created via `node-cookie`

```javascript
nodeCookie.parse(req, 'somesecret', true)
```

## License 
(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
