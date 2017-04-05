'use strict'

/**
 * node-cookie
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const test = require('japa')
const supertest = require('supertest')
const http = require('http')
const sig = require('cookie-signature')
const Keygrip = require('keygrip')
const Cookie = require('../')
const queryString = require('querystring')

test.group('Cookie', function () {
  test('should return an empty object when no cookies have been set', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.cookies, {})
  })

  test('should parse plain cookies for a given request when secret is not set', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=foo']).expect(200)
    assert.deepEqual(res.body.cookies, {user: 'foo'})
  })

  test('should parse and unsing cookies when secret key is present', async function (assert) {
    const SECRET = 'bubblegum'
    const cookieVal = sig.sign('foo', SECRET)

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, SECRET)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=' + cookieVal]).expect(200)
    assert.deepEqual(res.body.cookies, {user: 'foo'})
  })

  test('should decrypt and unsign cookies when decrypt option is set', async function (assert) {
    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    const cookieVal = sig.sign('foo', SECRET)
    const encryptedVal = keygrip.encrypt(cookieVal).toString('base64')

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=' + encryptedVal]).expect(200)
    assert.deepEqual(res.body.cookies, {user: 'foo'})
  })

  test('should not return cookie value when unable to decrypt cookie', async function (assert) {
    const SECRET = 'bubble'
    const keygrip = new Keygrip([SECRET])
    const cookieVal = sig.sign('foo', SECRET)
    const encryptedVal = keygrip.encrypt(cookieVal).toString('base64')

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, 'bubblegum', true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['user=' + encryptedVal]).expect(200)
    assert.deepEqual(res.body.cookies, {})
  })

  test('should decrypt and unsign cookies from an array', async function (assert) {
    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    const cookieVal = sig.sign('j:' + JSON.stringify([1, 2, 3]), SECRET)
    const encryptedVal = keygrip.encrypt(cookieVal).toString('base64')

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['cart=' + encryptedVal]).expect(200)
    assert.deepEqual(res.body.cookies, {cart: [1, 2, 3]})
  })

  test('should parse plain cookies from an array', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['cart=j:' + JSON.stringify([1, 2, 3])]).expect(200)
    assert.deepEqual(res.body.cookies, {cart: [1, 2, 3]})
  })

  test('should return undefined when cookie starts with j: but is not a valid object', async function (assert) {
    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['cart=j:something']).expect(200)
    assert.deepEqual(res.body.cookies, {})
  })

  test('should parse and unsign cookies from an array', async function (assert) {
    const SECRET = 'bubblegum'
    const cookieVal = sig.sign('j:' + JSON.stringify([1, 2, 3]), SECRET)

    const server = http.createServer(function (req, res) {
      const cookies = Cookie.parse(req, SECRET)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', ['cart=' + cookieVal]).expect(200)
    assert.deepEqual(res.body.cookies, {cart: [1, 2, 3]})
  })

  test('should create plain cookies to be set on response', async function (assert) {
    const server = http.createServer(function (req, res) {
      Cookie.create(req, res, 'name', 'foo')
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=foo'])
  })

  test('should remove old cookie value when trying to set cookie multiple times', async function (assert) {
    const server = http.createServer(function (req, res) {
      Cookie.create(req, res, 'name', 'foo')
      Cookie.create(req, res, 'name', 'bar')
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=bar'])
  })

  test('should create signed cookies to be set on response', async function (assert) {
    const SECRET = 'bubblegum'
    const valueToBe = sig.sign('foo', SECRET)

    const server = http.createServer(function (req, res) {
      Cookie.create(req, res, 'name', 'foo', {}, SECRET)
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=' + queryString.escape(valueToBe)])
  })

  test('should create signed and encrypted cookies to be set on response', async function (assert) {
    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    let valueToBe = sig.sign('foo', SECRET)
    valueToBe = keygrip.encrypt(valueToBe).toString('base64')

    const server = http.createServer(function (req, res) {
      Cookie.create(req, res, 'name', 'foo', {}, SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=' + queryString.escape(valueToBe)])
  })

  test('should set multiple cookies on response', async function (assert) {
    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    let valueToBe = sig.sign('foo', SECRET)
    valueToBe = keygrip.encrypt(valueToBe).toString('base64')

    let ageToBe = sig.sign('22', SECRET)
    ageToBe = keygrip.encrypt(ageToBe).toString('base64')

    const server = http.createServer(function (req, res) {
      Cookie.create(req, res, 'name', 'foo', {}, SECRET, true)
      Cookie.create(req, res, 'age', 22, {}, SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['name=' + queryString.escape(valueToBe), 'age=' + queryString.escape(ageToBe)])
  })

  test('should set object as a cookie value', async function (assert) {
    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    const data = {name: 'foo', age: 22}
    let valueToBe = sig.sign('j:' + JSON.stringify(data), SECRET)
    valueToBe = keygrip.encrypt(valueToBe).toString('base64')

    const server = http.createServer(function (req, res) {
      Cookie.create(req, res, 'user', data, {}, SECRET, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['user=' + queryString.escape(valueToBe)])
  })

  test('should set cookie when object is empty', async function (assert) {
    const server = http.createServer(function (req, res) {
      Cookie.create(req, res, 'age', {})
      res.writeHead(200, {'content-type': 'application/json'})
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.headers['set-cookie'], ['age=' + queryString.escape('j:' + JSON.stringify({}))])
  })
})
