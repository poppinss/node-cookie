
# Node Cookie

> Easily parse and write signed & encrypted cookies on Node.js HTTP requests.

<br />

<p align="center">
  <a href="http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png">
    <img src="http://i1117.photobucket.com/albums/k594/thetutlage/poppins-1_zpsg867sqyl.png" width="600px" />
  </a>
</p>

<br />

---

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor][appveyor-image]][appveyor-url]


## See also

1. [node-req](https://npmjs.org/package/node-req)
2. [node-res](https://npmjs.org/package/node-res)

## Basic Setup

```javascript
const http = require('http')
const nodeCookie = require('node-cookie')

http.createServer(function (req, res) {

  // this will update set-cookie header on res object.
  nodeCookie.create(res, 'user', 'virk')

}).listen(3000)
```

## Signing cookies with a secret

```javascript
const http = require('http')
const nodeCookie = require('node-cookie')

http.createServer(function (req, res) {

  nodeCookie.create(res, 'user', 'virk', '16charlongsecret')

}).listen(3000)
```

## Signing & encrypting cookies with a secret

```javascript
const http = require('http')
const nodeCookie = require('node-cookie')

http.createServer(function (req, res) {

  nodeCookie.create(res, 'user', 'virk', '16charlongsecret', true)

}).listen(3000)
```

## Methods

### getEncrypter
Returns an encrypter instance to be used for
encrypting the cookie. Since creating a new
instance each time is expensive, we cache
the instances based on secret and it is
less likely that someone will use a different
secret for each HTTP request.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| secret | String | Yes | &nbsp; |

**Returns**
Object

----
### parse
Parses cookies from HTTP header `Cookie` into
a javascript object. Also it will unsign
and decrypt cookies encrypted and signed
by this library using a secret.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| req | Object | Yes | &nbsp; |
| secret  | String | No | &nbsp; |
| decrypt  | Boolean | No | &nbsp; |

**Returns**
Object

----
### get
Returns value for a single cookie by its key. It is
recommended to make use of this function when you
want to pull a single cookie. Since the `parse`
method will eagerly unsign and decrypt all the
cookies.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| req | Object | Yes | &nbsp; |
| key | String | Yes | &nbsp; |
| secret  | String | No | &nbsp; |
| decrypt  | Boolean | No | &nbsp; |
| cookies  | Object | No | Use existing cookies object over re-parsing them from the header. |

**Returns**
Mixed

----
### create
Write cookie to the HTTP response object. It will append
duplicate cookies to the `Set-Cookie` header, since
browsers discard the duplicate cookies by themselves

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| res | Object | Yes | &nbsp; |
| key | String | Yes | &nbsp; |
| value | * | Yes | &nbsp; |
| options  | Object | No | &nbsp; |
| secret  | String | No | &nbsp; |
| encrypt  | Boolean | No | &nbsp; |

**Returns**
Void

----
### clear
Clears the cookie from browser by setting it's expiry
in past. This is required since there is no other
way to instruct the browser to delete a cookie.

Also this method will override the `expires` value on
the options object.

**Params**

| Param | Type | Required | Description |
|-----|-------|------|------|
| res | Object | Yes | &nbsp; |
| key | String | Yes | &nbsp; |
| options  | Object | No | &nbsp; |

**Returns**
Void

----


[appveyor-image]: https://ci.appveyor.com/api/projects/status/github/poppinss/node-req?branch=master&svg=true&passingText=Passing%20On%20Windows
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/node-cookie

[npm-image]: https://img.shields.io/npm/v/node-cookie.svg?style=flat-square
[npm-url]: https://npmjs.org/package/node-cookie

[travis-image]: https://img.shields.io/travis/poppinss/node-cookie/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/poppinss/node-cookie
