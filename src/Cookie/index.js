'use strict'

/*
 * node-cookie
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const parser = require('cookie')
const signature = require('cookie-signature')

/**
 * Cookie parser is a simple utility module to read
 * and write cookies on Node.js HTTP requests.
 * It supports cookie signing and encryption.
 *
 * @class Cookie
 * @static
 */
let Cookie = exports = module.exports = {}

/**
 * Parses cookie value from a JSON marked string into
 * a JSON object or returns the actual value when
 * value is not marked as JSON string.
 *
 * @method _parseJSON
 *
 * @param  {String}   value
 *
 * @return {String|Object|Null}
 */
Cookie._parseJSON = function (value) {
  if (typeof (value) === 'string' && value.substr(0, 2) !== 'j:') {
    return value
  }
  try {
    return JSON.parse(value.slice(2))
  } catch (err) {
    return null
  }
}

/**
 * Marks a cookie as a JSON string when the value of
 * cookie is an object.
 *
 * @method _stringifyJSON
 *
 * @param  {Mixed}      value
 *
 * @return {String}
 *
 * @private
 */
Cookie._stringifyJSON = function (value) {
  return typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value)
}

/**
 * Signs the cookie value when signature exists.
 *
 * @method _signValue
 *
 * @param  {String}   value
 * @param  {String}   [secret = null]
 *
 * @return {String}
 *
 * @private
 */
Cookie._signValue = function (value, secret = null) {
  if (!secret) {
    return value
  }
  return `s:${signature.sign(value, secret)}`
}

/**
 * Unsigns the cookie value when value is signed
 * and secret exists.
 *
 * @method _unSignValue
 *
 * @param  {String}     value
 * @param  {String}     secret
 *
 * @return {String}
 *
 * @private
 */
Cookie._unSignValue = function (value, secret = null) {
  /**
   * Value is not signed, return as it is.
   */
  if (value.substr(0, 2) !== 's:') {
    return value
  }

  /**
   * Value is signed but secret does not
   * exists, so return null
   */
  if (!secret) {
    return null
  }

  /**
   * Attempt to unsign value with secret
   */
  return signature.unsign(value.slice(2), secret) || null
}

/**
 * Appends values to the cookie header.
 *
 * @method _append
 *
 * @param  {Object} res
 * @param  {String} key
 * @param  {String} cookie
 *
 * @return {void}
 */
Cookie._append = function (res, key, cookie) {
  const cookies = res.getHeader('Set-Cookie') || []
  Array.isArray(cookies) ? cookies.push(cookie) : [cookies].push(cookie)
  res.setHeader('Set-Cookie', cookies.map(String))
}

/**
 * Parses cookies from HTTP header `Cookie` into
 * a javascript object. Also it will unsign
 * and decrypt cookies encrypted and signed
 * by this library using a secret.
 *
 * @method parse
 *
 * @param  {Object}  req
 * @param  {String}  [secret = null]
 * @param  {Boolean} [decrypt = false]
 *
 * @return {Object}
 */
Cookie.parse = function (req, secret = null, decrypt = false) {
  const cookieString = req.headers['cookie']

  /**
   * Return an empty object when header value for
   * cookie is empty.
   */
  if (!cookieString) return {}

  const cookies = parser.parse(cookieString)

  /**
   * We need to parse cookies by unsign them, if secret
   * is defined and also converting JSON marked string
   * into a valid javascript object.
   *
   * @type {Object}
   */
  const parsedCookies = {}
  Object.keys(cookies).forEach((key) => {
    const cookie = Cookie._unSignValue(cookies[key], secret)
    parsedCookies[key] = cookie ? Cookie._parseJSON(cookie) : cookie
  })

  return parsedCookies
}

/**
 * Write cookie to the HTTP response object. It will append
 * duplicate cookies to the `Set-Cookie` header, since
 * browsers discard the duplicate cookies by themselves
 *
 * @method create
 *
 * @param  {Object}  res
 * @param  {String}  key
 * @param  {*}       value
 * @param  {Object}  [options = {}]
 * @param  {String}  [secret = null]
 * @param  {Boolean} [encrypt = false]
 *
 * @return {void}
 */
Cookie.create = function (res, key, value, options = {}, secret = null, encrypt = false) {
  value = Cookie._stringifyJSON(value)
  value = Cookie._signValue(value, secret)

  const cookie = parser.serialize(key, String(value), options)
  Cookie._append(res, key, cookie)
}

/**
 * Clears the cookie from browser by setting it's expiry
 * in past. This is required since there is no other
 * way to instruct the browser to delete a cookie.
 *
 * Also this method will override the `expires` value on
 * the options object.
 *
 * @method clear
 *
 * @param  {Object} res
 * @param  {String} key
 * @param  {Object} [options = {}]
 *
 * @return {void}
 */
Cookie.clear = function (res, key, options = {}) {
  options.expires = new Date(1)
  const cookie = parser.serialize(key, String(''), options)
  Cookie._append(res, key, cookie)
}
