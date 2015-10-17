'use strict'

/**
 * node-cookie
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const parser    = require('cookie')
const Keygrip   = require('keygrip')
const signature = require('cookie-signature')

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
 *   Cookie.parse(request)
 *   // if cookies are signed using a secret
 *   Cookie.parse(request, secret)
 *   // if cookies are encrypted using a secret
 *   Cookie.parse(request, secret, true)
 * @method parse
 * @param  {Object} request
 * @param  {String} secret
 * @param  {Boolean} decrypt
 * @return {Object}
 */
Cookie.parse = function (request, secret, decrypt) {

  let keygrip = null

  /**
   * reading cookies from request headers
   * @type {String}
   */
  let requestCookies = request.headers['cookie']
  if(!requestCookies) return {}

  /**
   * parsing cookies into an object
   * @type {Object}
   */
  requestCookies = parser.parse(requestCookies)

  /**
   * if decryption is set create a new instance
   * of keygrip using secret key
   */
  if(decrypt && secret){
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

    if(decrypt && secret){
      requestCookies[index] = Cookie._decryptCookie(keygrip, requestCookies[index])
    }

    unsignedCookies[index] = secret
      ? Cookie._jsonCookie(signature.unsign(requestCookies[index],secret))
      : Cookie._jsonCookie(requestCookies[index])
  })

  return unsignedCookies
}

/**
 * @description decrypting cookie value using keygrip instance
 * @method _decryptCookie
 * @param  {Object}       keygrip [description]
 * @param  {Mixed}       value   [description]
 * @return {Mixed}               [description]
 * @private
 */
Cookie._decryptCookie = function (keygrip, value) {
  const decrypted = keygrip.decrypt(new Buffer(value, 'base64'))
  if(decrypted[0]){
    return decrypted[0].toString('utf8')
  }
  return null
}

/**
 * @description converting object values back to
 * object if they have j: prepended on value
 * @method _jsonCookie
 * @param  {String}    str [description]
 * @return {Mixed}        [description]
 * @private
 */
Cookie._jsonCookie = function (str) {
  if (str.substr(0, 2) !== 'j:') {
    return str
  }
  try {
    return JSON.parse(str.slice(2))
  } catch (err) {
    return undefined
  }
}

/**
 * @description create a new cookie object with final
 * value to set on header
 * @method create
 * @param  {String} key     [description]
 * @param  {Mixed} value   [description]
 * @param  {Object} options [description]
 * @param  {String} secret  [description]
 * @param  {Boolean} encrypt [description]
 * @return {Object}         [description]
 * @public
 */
Cookie.create = function (key, value, options, secret, encrypt) {

  /**
   * stringify object is value has
   * typeof object, since cookie
   * have to be string
   * @type {String}
   */
  let cookieValue = typeof value === 'object'
    ? 'j:' + JSON.stringify(value)
    : String(value);

  if(secret){
    /**
     * if secret sign cookie
     */
    cookieValue = signature.sign(cookieValue,secret)
    /**
     * if encrypt and secret encrypt cookie
     */
    if(encrypt){
      const keygrip = new Keygrip([secret])
      cookieValue = keygrip.encrypt(cookieValue).toString('base64')
    }
  }

  const cookie = parser.serialize(key, String(cookieValue), options)
  return {key,cookie}
}

/**
 * @description set cookie header using an array of cookie
 * @method setHeader
 * @param  {Object}  response [description]
 * @param  {Array}  cookies  [description]
 * @public
 */
Cookie.setHeader = function (response, cookies) {

  let cookiesArray = []
  Object.keys(cookies).forEach(function (index) {
    const cookie = cookies[index].cookie
    cookiesArray.push(cookie)
  })
  response.setHeader('Set-Cookie',cookiesArray)
}
