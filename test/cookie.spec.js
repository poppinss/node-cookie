'use strict'

/**
 * node-cookie
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const chai        = require('chai')
const supertest   = require('co-supertest')
const expect      = chai.expect
const http        = require('http')
const sig         = require('cookie-signature')
const Keygrip     = require('keygrip')
const Cookie      = require('../')
const queryString = require('querystring')

require('co-mocha')

describe('Cookie', function () {

  it('should return an empty object when no cookies have been set', function * () {

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.cookies).deep.equal({})

  })

  it('should parse plain cookies for a given request when secret is not set', function * () {

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['user=foo']).expect(200).end()
    expect(res.body.cookies).deep.equal({user:'foo'})

  })

  it('should parse and unsing cookies when secret key is present', function * () {

    const SECRET = 'bubblegum'
    const cookieVal = sig.sign('foo',SECRET)

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req,SECRET)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['user='+cookieVal]).expect(200).end()
    expect(res.body.cookies).deep.equal({user:'foo'})

  })


  it('should decrypt and unsign cookies when decrypt option is set', function * () {

    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    const cookieVal = sig.sign('foo',SECRET)
    const encryptedVal = keygrip.encrypt(cookieVal).toString('base64')

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req,SECRET,true)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['user='+encryptedVal]).expect(200).end()
    expect(res.body.cookies).deep.equal({user:'foo'})

  })

  it('should not return cookie value when unable to decrypt cookie', function * () {

    const SECRET = 'bubble'
    const keygrip = new Keygrip([SECRET])
    const cookieVal = sig.sign('foo',SECRET)
    const encryptedVal = keygrip.encrypt(cookieVal).toString('base64')

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req,'bubblegum',true)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['user='+encryptedVal]).expect(200).end()
    expect(res.body.cookies).deep.equal({})

  })

  it('should decrypt and unsign cookies from an array', function * () {

    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    const cookieVal = sig.sign("j:"+JSON.stringify([1,2,3]),SECRET)
    const encryptedVal = keygrip.encrypt(cookieVal).toString('base64')

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req,SECRET,true)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['cart='+encryptedVal]).expect(200).end()
    expect(res.body.cookies).deep.equal({cart:[1,2,3]})

  })

  it('should parse plain cookies from an array', function * () {

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['cart=j:'+JSON.stringify([1,2,3])]).expect(200).end()
    expect(res.body.cookies).deep.equal({cart:[1,2,3]})

  })

  it('should return undefined when cookie starts with j: but is not a valid object', function * () {

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['cart=j:something']).expect(200).end()
    expect(res.body.cookies).deep.equal({})

  })

  it('should parse and unsign cookies from an array', function * () {

    const SECRET = 'bubblegum'
    const cookieVal = sig.sign("j:"+JSON.stringify([1,2,3]),SECRET)

    const server = http.createServer(function (req,res) {
      const cookies = Cookie.parse(req,SECRET)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({cookies}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['cart='+cookieVal]).expect(200).end()
    expect(res.body.cookies).deep.equal({cart:[1,2,3]})

  })

  it('should create plain cookies to be set on response', function * () {

    const server = http.createServer(function (req,res) {
      const cookie = Cookie.create(req, res, 'name','foo')
      res.writeHead(200,{"content-type": "application/json"})
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['name=foo'])
  })

  it('should create signed cookies to be set on response', function * () {

    const SECRET = 'bubblegum'
    const valueToBe = sig.sign('foo',SECRET)

    const server = http.createServer(function (req,res) {
      Cookie.create(req, res, 'name','foo', {}, SECRET)
      res.writeHead(200,{"content-type": "application/json"})
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['name='+queryString.escape(valueToBe)])
  })

  it('should create signed and encrypted cookies to be set on response', function * () {

    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    let valueToBe = sig.sign('foo',SECRET)
    valueToBe = keygrip.encrypt(valueToBe).toString('base64')

    const server = http.createServer(function (req,res) {
      Cookie.create(req, res, 'name','foo', {}, SECRET, true)
      res.writeHead(200,{"content-type": "application/json"})
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['name='+queryString.escape(valueToBe)])
  })

  it('should set multiple cookies on response', function * () {

    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    let valueToBe = sig.sign('foo',SECRET)
    valueToBe = keygrip.encrypt(valueToBe).toString('base64')

    let ageToBe = sig.sign('22',SECRET)
    ageToBe = keygrip.encrypt(ageToBe).toString('base64')


    const server = http.createServer(function (req,res) {

      Cookie.create(req, res, 'name','foo', {}, SECRET, true)
      Cookie.create(req, res, 'age',22, {}, SECRET, true)
      res.writeHead(200,{"content-type": "application/json"})
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['name='+queryString.escape(valueToBe),'age='+queryString.escape(ageToBe)])
  })


it('should set object as a cookie value', function * () {

    const SECRET = 'bubblegum'
    const keygrip = new Keygrip([SECRET])
    const data = {name:'foo',age:22}
    let cookies = []
    let valueToBe = sig.sign("j:"+JSON.stringify(data),SECRET)
    valueToBe = keygrip.encrypt(valueToBe).toString('base64')

    const server = http.createServer(function (req,res) {
      Cookie.create(req, res, 'user',data, {}, SECRET, true)
      res.writeHead(200,{"content-type": "application/json"})
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['user='+queryString.escape(valueToBe)])
  })

  it('should clear an existing cookie', function * () {

    let cookies = []

    const server = http.createServer(function (req,res) {
      Cookie.clear(req, res, 'user')
      res.writeHead(200,{"content-type": "application/json"})
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['user=foo']).expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['user=foo','user=; Expires=Thu, 01 Jan 1970 00:00:00 GMT'])
  })

  it('should not override existing cookies while setting up new cookies', function * () {

    const server = http.createServer(function (req,res) {
      Cookie.create(req, res, 'age','22')
      res.writeHead(200,{"content-type": "application/json"})
      res.end()
    })

    const res = yield supertest(server).get('/').set('Cookie',['user=foo']).expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['user=foo','age=22'])
  })

  it('should set cookie when object is empty', function * () {

    const server = http.createServer(function (req,res) {
      Cookie.create(req, res, 'age',{})
      res.writeHead(200,{"content-type": "application/json"})
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['age='+ queryString.escape('j:'+JSON.stringify({}))])
  })

})
