'use strict'

/*
 * node-cookie
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const supertest = require('supertest')
const http = require('http')
const sig = require('cookie-signature')
const queryString = require('querystring')
const simpleEncryptor = require('simple-encryptor')
const _ = require('lodash')

const Cookie = require('../')

const getSecret = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return _.map(_.range(0, 18), (num) => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

test.group('Parse Cookies', function () {
  test('return an empty object when no cookies have been set', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.cookies, {})
  })

  test('parse plain cookies for a given request when secret is not set', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=foo']).expect(200)
    assert.deepEqual(res.body.cookies, {user: 'foo'})
  })

  test('parse and unsing cookies when secret key is present', async function (assert) {
    const SECRET = 'bubblegum'
    const cookieVal = `s:${sig.sign('foo', SECRET)}`

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, SECRET)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=' + cookieVal]).expect(200)
    assert.deepEqual(res.body.cookies, {user: 'foo'})
  })

  test('return null when cookie value is signed but secret is missing', async function (assert) {
    const SECRET = 'bubblegum'
    const cookieVal = `s:${sig.sign('foo', SECRET)}`

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=' + cookieVal]).expect(200)
    assert.deepEqual(res.body.cookies, {user: null})
  })

  test('parse plain cookies from an array', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['cart=j:' + JSON.stringify([1, 2, 3])]).expect(200)
    assert.deepEqual(res.body.cookies, {cart: [1, 2, 3]})
  })

  test('return null when cookie is marked as JSON string but not valid JSON object', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['cart=j:something']).expect(200)
    assert.deepEqual(res.body.cookies, {cart: null})
  })

  test('parse and unsign cookies from an array', async function (assert) {
    const SECRET = 'bubblegum'
    const cookieVal = `s:${sig.sign('j:' + JSON.stringify([1, 2, 3]), SECRET)}`

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, SECRET)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['cart=' + cookieVal]).expect(200)
    assert.deepEqual(res.body.cookies, {cart: [1, 2, 3]})
  })

  test('return null when secret is incorrect is cookie is signed', async function (assert) {
    const SECRET = 'bubblegum'
    const cookieVal = `s:${sig.sign('foo', SECRET)}`

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, 'foo')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=' + cookieVal]).expect(200)
    assert.deepEqual(res.body.cookies, {user: null})
  })

  test('do not unsign cookie when secret is present but cookie is not signed', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, 'bubblegum')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=foo']).expect(200)
    assert.deepEqual(res.body.cookies, {user: 'foo'})
  })

  test('parse encrypted cookies', async function (assert) {
    const SECRET = getSecret()
    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const age = `s:${sig.sign('22', SECRET)}`
    const res = await supertest(server).get('/').set('Cookie', [`age=${encrypter.encrypt(age)}`]).expect(200)
    assert.deepEqual(res.body.cookies, {age: '22'})
  })

  test('return encrypted value when decrypt is set to false', async function (assert) {
    const SECRET = getSecret()
    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, SECRET, false)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const age = `s:${sig.sign('22', SECRET)}`
    const res = await supertest(server).get('/').set('Cookie', [`age=${encrypter.encrypt(age)}`]).expect(200)
    assert.notEqual(res.body.cookies.age, '22')
  })

  test('return null when secret mis-match', async function (assert) {
    const SECRET = getSecret()
    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, getSecret(), true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const age = `s:${sig.sign('22', SECRET)}`
    const res = await supertest(server).get('/').set('Cookie', [`age=${encrypter.encrypt(age)}`]).expect(200)
    assert.isNull(res.body.cookies.age)
  })

  test('parse a single cookie', async function (assert) {
    const SECRET = getSecret()
    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })

    const server = http.createServer(function (req, res) {
      const age = Cookie.get(req, 'age', SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({age}))
      res.end()
    })

    const age = `s:${sig.sign('22', SECRET)}`
    const res = await supertest(server).get('/').set('Cookie', [`age=${encrypter.encrypt(age)}`]).expect(200)
    assert.equal(res.body.age, '22')
  })

  test('look inside existing cookie set over re-parsing the header', async function (assert) {
    const server = http.createServer(function (req, res) {
      const age = Cookie.get(req, 'age', null, false, {age: 26})
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({age}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['age=22']).expect(200)
    assert.equal(res.body.age, '26')
  })
})

// SETTING COOKIES
test.group('Set Cookies', function () {
  test('set plain cookies on HTTP response', async function (assert) {
    const server = http.createServer(function (req, res) {
      Cookie.create(res, 'name', 'foo')
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=foo'])
  })

  test('set cookie options when defined', async function (assert) {
    const server = http.createServer(function (req, res) {
      Cookie.create(res, 'name', 'foo', { path: '/blog' })
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=foo; Path=/blog'])
  })

  test('set multiple cookies with same options when create method is called twice', async function (assert) {
    const server = http.createServer(function (req, res) {
      Cookie.create(res, 'name', 'foo')
      Cookie.create(res, 'name', 'bar')
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=foo', 'name=bar'])
  })

  test('create signed cookies to be set on response', async function (assert) {
    const SECRET = 'bubblegum'
    const valueToBe = sig.sign('foo', SECRET)

    const server = http.createServer(function (req, res) {
      Cookie.create(res, 'name', 'foo', {}, SECRET)
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=' + queryString.escape(`s:${valueToBe}`)])
  })

  test('set cookie when object is empty', async function (assert) {
    const server = http.createServer(function (req, res) {
      Cookie.create(res, 'age', {})
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['age=' + queryString.escape('j:' + JSON.stringify({}))])
  })

  test('set encrypted cookie when encryption is set to true', async function (assert) {
    const SECRET = getSecret()
    const valueToBe = sig.sign('22', SECRET)
    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })

    const server = http.createServer(function (req, res) {
      Cookie.create(res, 'age', 22, {}, SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    const value = res.headers['set-cookie'][0].replace('age=', '')
    assert.equal(encrypter.decrypt(queryString.unescape(value)), `s:${valueToBe}`)
  })

  test('set object as encrypted cookie', async function (assert) {
    const SECRET = getSecret()
    const valueToBe = sig.sign(`j:${JSON.stringify({name: 'virk'})}`, SECRET)
    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })

    const server = http.createServer(function (req, res) {
      Cookie.create(res, 'name', {name: 'virk'}, {}, SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    const value = res.headers['set-cookie'][0].replace('name=', '')
    assert.equal(encrypter.decrypt(queryString.unescape(value)), `s:${valueToBe}`)
  })

  test('set expiry to past when clear cookie is called', async function (assert) {
    const server = http.createServer(function (req, res) {
      Cookie.clear(res, 'name')
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT'])
  })
})
