'use strict'

/**
 * node-cookie
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const parser = require('cookie')
const Keygrip = require('keygrip')
const signature = require('cookie-signature')
const debug = require('debug')('poopins:cookie')

/**
 * @description parses request cookies from request header
 * @module Cookie
 * @type {Object}
 */
let Cookie = exports = module.exports = {}

/**
 * @description reads cookie header from request and return
 * parsed cookies as an object
 * @example
 *   // parsing plain cookies
 *   Cookie.parse(req)
 *   // if cookies are signed using a secret
 *   Cookie.parse(req, secret)
 *   // if cookies are encrypted using a secret
 *   Cookie.parse(req, secret, true)
 * @method parse
 * @param  {Object} req
 * @param  {String} secret
 * @param  {Boolean} decrypt
 * @return {Object}
 */
Cookie.parse = function (req, secret, decrypt) {
  let keygrip = null

  debug('parsing request cookies')

  /**
   * reading cookies from request headers
   * @type {String}
   */
  let requestCookies = req.headers['cookie']
  if (!requestCookies) return {}

  /**
   * parsing cookies into an object
   * @type {Object}
   */
  requestCookies = parser.parse(requestCookies)

  /**
   * if decryption is set create a new instance
   * of keygrip using secret key
   */
  if (decrypt && secret) {
    keygrip = new Keygrip([secret])
  }

  /**
   * storing unsigned cookies after looping
   * through each of them and transforming
   * them to back to useable format.
   * @type {Object}
   */
  let unsignedCookies = {}

  Object.keys(requestCookies).forEach(function (index) {
    if (decrypt && secret) {
      requestCookies[index] = Cookie._decryptCookie(keygrip, requestCookies[index])
    }

    if (requestCookies[index]) {
      unsignedCookies[index] = secret
        ? Cookie._jsonCookie(signature.unsign(requestCookies[index], secret))
        : Cookie._jsonCookie(requestCookies[index])
    } else {
      debug('unable to decrypt cookie, omitting from return object')
    }
  })

  return unsignedCookies
}

/**
 * @description decrypting cookie value using keygrip instance
 * @method _decryptCookie
 * @param  {Object}       keygrip
 * @param  {Mixed}       value
 * @return {Mixed}
 * @private
 */
Cookie._decryptCookie = function (keygrip, value) {
  const decrypted = keygrip.decrypt(new Buffer(value, 'base64'))
  if (decrypted[0]) {
    return decrypted[0].toString('utf8')
  }
  return null
}

/**
 * @description converting object values back to
 * object if they have j: prepended on value
 * @method _jsonCookie
 * @param  {String}    str
 * @return {Mixed}
 * @private
 */
Cookie._jsonCookie = function (str) {
  if (typeof (str) === 'string' && str.substr(0, 2) !== 'j:') {
    return str
  }
  try {
    debug('detected javascript object inside cookie')
    return JSON.parse(str.slice(2))
  } catch (err) {
    return undefined
  }
}

/**
 * @description create a new cookie object with final
 * value to set on header
 * @method create
 * @param  {String} key
 * @param  {Mixed} value
 * @param  {Object} options
 * @param  {String} secret
 * @param  {Boolean} encrypt
 * @return {Object}
 * @public
 */
Cookie.create = function (req, res, key, value, options, secret, encrypt) {
  /**
   * stringify object is value has
   * typeof object, since cookie
   * have to be string
   * @type {String}
   */
  let cookieValue = typeof value === 'object'
    ? 'j:' + JSON.stringify(value)
    : String(value)

  if (secret) {
    /**
     * if secret sign cookie
     */
    cookieValue = signature.sign(cookieValue, secret)
    /**
     * if encrypt and secret encrypt cookie
     */
    if (encrypt) {
      const keygrip = new Keygrip([secret])
      cookieValue = keygrip.encrypt(cookieValue).toString('base64')
    }
  }
  const cookie = parser.serialize(key, String(cookieValue), options)
  Cookie._append(req, res, key, cookie)
}

/**
 * @description appends cookie to existing cookies, it can be on
 * request object or response object.
 * @method append
 * @param  {Object} req
 * @param  {Object} res
 * @param  {String} key
 * @param  {Array} cookie
 * @return {void}
 * @private
 */
Cookie._append = function (req, res, key, cookie) {
  /**
   * reading existing cookies on response header, they will
   * exist when cookie.create has been called multiple
   * times
   * @type {Array}
   */
  const existingCookies = res.getHeader('Set-Cookie') || []

  /**
   * joining request and response cookies together with
   * new cookie
   * @type {Array}
   */
  const cookiesArray = existingCookies.filter(function (value) {
    return value.indexOf(`${key}=`) !== 0
  })
  cookiesArray.push(cookie)
  res.setHeader('Set-Cookie', cookiesArray)
}

/**
 * @description clears existing cookie by setting it's expiry
 * date in past
 * @method clear
 * @param  {Object} req
 * @param  {Object} res
 * @param  {String} key
 * @param  {Object} options
 * @return {void}
 */
Cookie.clear = function (req, res, key, options) {
  options = options || {}
  options.expires = new Date(1)
  const cookie = parser.serialize(key, String(''), options)
  Cookie._append(req, res, key, cookie)
}
