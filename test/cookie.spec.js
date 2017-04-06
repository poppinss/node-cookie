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
const Cookie = require('../')
const queryString = require('querystring')

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
})
