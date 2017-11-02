'use strict'

const clients = require('restify-clients')
const crypto = require('crypto')
const Q = require('q')

/**
 * A Node.js client for the KuCoin API.
 * @class
 * @version 0.0.2
 * @param {string} apiKey Your KuCoin API Key.
 * @param {string} apiSecret Your KuCoin API Secret.
 * @example
 * let kc = new Kucoin();
 */
class Kucoin {

  /**
   * You'll need to provide your KuCoin API key and secret.
   * @param {string} apiKey Your KuCoin API Key.
   * @param {string} apiSecret Your KuCoin API Secret.
   */
  constructor(apiKey, apiSecret) {
    this._apiKey = apiKey
    this._apiSecret = apiSecret
    this.client = clients.createJsonClient({
      url: 'https://api.kucoin.com'
    })
    this.path_prefix = '/v1'
  }

  /**
   * Send the request to the KuCoin API, sign if authorisation is required.
   * @access private
   * @param {string} method HTTP request method, either 'get' or 'post'.
   * @param {string} endpoint API endpoint URL suffix.
   * @param {boolean} [signed=false] Whether this endpoint requires authentiation.
   * @param {Object} params Any parameters for the request.
   * @return {Promise} An object containing the API response.
   */
  rawRequest(method, endpoint, signed = false, params) {
    let deferred = Q.defer()
    let path = this.path_prefix + endpoint
    let nonce = new Date().getTime()
    let queryString
    if (params !== undefined) {
      queryString = [];
      for (let key in params) {
        queryString.push(key + '=' + params[key])
      }
      queryString.sort()
      queryString = queryString.join('&')
    } else {
      queryString = ''
    }
    let options = {
      path: path + (queryString ? '?' + queryString : ''),
      headers: {}
    }
    if (signed) {
      options.headers = {
        'Content-Type': 'application/json',
        'KC-API-KEY': this._apiKey,
        'KC-API-NONCE': nonce,
        'KC-API-SIGNATURE': this.getSignature(path, queryString, nonce)
      }
    } else {
      options.headers = {
        'Content-Type': 'application/json'
      }
    }
    if (method == 'post') {
      this.client.post(options, {}, (err, req, res, obj) => {
        if (err || !obj.success) {
          if (!err && !obj.success) {
            err = obj
          }
          deferred.reject(err)
        } else {
          deferred.resolve(obj)
        }
      })
    } else {
      this.client.get(options, (err, req, res, obj) => {
        if (err || !obj.success) {
          if (!err && !obj.success) {
            err = obj
          }
          deferred.reject(err)
        } else {
          deferred.resolve(obj)
        }
      })
    }
    return deferred.promise
  }

  /**
   * Generate a signature to sign API requests that require authorisation.
   * @access private
   * @param {string} path API endpoint URL suffix.
   * @param {string} queryString A querystring of parameters for the request.
   * @param {number} nonce Number of milliseconds since the Unix epoch.
   * @return {string} A string to be used as the authorisation signature.
   */
  getSignature(path, queryString, nonce) {
    let strForSign = path + '/' + nonce + '/' + queryString
    let signatureStr = new Buffer(strForSign).toString('base64')
    let signatureResult = crypto.createHmac('sha256', this._apiSecret)
      .update(signatureStr)
      .digest('hex')
    return signatureResult
  }

  /**
   * Do a standard public request.
   * @access private
   * @param {string} method HTTP request method, either 'get' or 'post'.
   * @param {string} endpoint API endpoint URL suffix.
   * @param {Object} params Any parameters for the request.
   * @return {Promise} An object containing the API response.
   */
  doRequest(method, endpoint, params) {
    return this.rawRequest(method, endpoint, false, params)
  }

  /**
   * Do a signed private request.
   * @access private
   * @param {string} method HTTP request method, either 'get' or 'post'.
   * @param {string} endpoint API endpoint URL suffix.
   * @param {Object} params Any parameters for the request.
   * @return {Promise} An object containing the API response.
   */
  doSignedRequest(method, endpoint, params) {
    return this.rawRequest(method, endpoint, true, params)
  }

  /**
   * Retrieve exchange rates for coins.
   * @access public
   * @param {{symbols: string[]}} [params] An Array of symbols, or if blank BTC will be returned.
   * @return {Promise} An object containing the API response.
   * @example <caption>Specify one or more symbols:</caption>
   * kc.getExchangeRates({
   *   symbols: ['NEO','GAS']
   * }).then(console.log).catch(console.error)
   * 
   * // Returns:
   * 
   * {
   *   "success": true,
   *   "code": "OK",
   *   "msg": "Operation succeeded.",
   *   "timestamp": 1509589905631,
   *   "data": {
   *     "currencies": [["USD", "$"], ["EUR", "€"], ["AUD", "$"], ["CAD", "$"], ["CHF", "CHF"], ["CNY", "¥"], ["GBP", "£"], ["JPY", "¥"], ["NZD", "$"], ["BGN", "лв."], ["BRL", "R$"], ["CZK", "Kč"], ["DKK", "kr"], ["HKD", "$"], ["HRK", "kn"], ["HUF", "Ft"], ["IDR", "Rp"], ["ILS", "₪"], ["INR", "₹"], ["KRW", "₩"], ["MXN", "$"], ["MYR", "RM"], ["NOK", "kr"], ["PHP", "₱"], ["PLN", "zł"], ["RON", "lei"], ["RUB", "₽"], ["SEK", "kr"], ["SGD", "$"], ["THB", "฿"], ["TRY", "₺"], ["ZAR", "R"]],
   *     "rates": {
   *       "GAS": { "CHF": 14.57, "HRK": 94.19, "MXN": 279.02, "ZAR": 205.31, "INR": 939.59, "CNY": 96.15, "THB": 482.3, "AUD": 18.95, "ILS": 51.16, "KRW": 16176.81, "JPY": 1660.88, "PLN": 53.03, "GBP": 10.94, "IDR": 197577.69, "HUF": 3904.86, "PHP": 751.63, "TRY": 55.6, "RUB": 845.61, "HKD": 113.47, "EUR": 12.52, "DKK": 93.21, "USD": 14.54, "CAD": 18.77, "MYR": 61.54, "BGN": 24.49, "NOK": 118.5, "RON": 57.66, "SGD": 19.8, "CZK": 320.11, "SEK": 122.16, "NZD": 21.12, "BRL": 47.78
   *       },
   *       "NEO": {
   *         "CHF": 25.33, "HRK": 163.66, "MXN": 484.81, "ZAR": 356.73, "INR": 1632.55, "CNY": 167.07, "THB": 838.01, "AUD": 32.94, "ILS": 88.89, "KRW": 28107.31, "JPY": 2885.78, "PLN": 92.14, "GBP": 19.01, "IDR": 343292.4, "HUF": 6784.72, "PHP": 1305.97, "TRY": 96.61, "RUB": 1469.25, "HKD": 197.16, "EUR": 21.76, "DKK": 161.95, "USD": 25.27, "CAD": 32.61, "MYR": 106.93, "BGN": 42.56, "NOK": 205.9, "RON": 100.18, "SGD": 34.4, "CZK": 556.2, "SEK": 212.27, "NZD": 36.7, "BRL": 83.02
   *       }
   *     }
   *   }
   * }
   * @example <caption>Retrieve data for BTC by default:</caption>
   * kc.getExchangeRates().then(console.log).catch(console.error)
   * 
   * // Returns:
   * 
   * {
   *   "success": true,
   *   "code": "OK",
   *   "msg": "Operation succeeded.",
   *   "timestamp": 1509590207497,
   *   "data": {
   *     "rates": {
   *       "BTC": { "CHF": 6817.62, "HRK": 44045.89, "MXN": 130476.13, "ZAR": 96007.15, "INR": 439363.98, "CNY": 44963.39, "THB": 225531.1, "AUD": 8865.49, "ILS": 23923.57, "KRW": 7564405.86, "JPY": 776640.44, "PLN": 24798.21, "GBP": 5118.25, "IDR": 92388859.2, "HUF": 1825945.01, "PHP": 351470.78, "TRY": 26002.05, "RUB": 395413.97, "HKD": 53061.7, "EUR": 5857.14, "DKK": 43586.13, "USD": 6801.3, "CAD": 8777.75, "MYR": 28779.7, "BGN": 11455.42, "NOK": 55414.27, "RON": 26962.39, "SGD": 9259.28, "CZK": 149689.81, "SEK": 57127.51, "NZD": 9878.88, "BRL": 22344.99
   *       }
   *     },
   *     "currencies": [["USD", "$"], ["EUR", "€"], ["AUD", "$"], ["CAD", "$"], ["CHF", "CHF"], ["CNY", "¥"], ["GBP", "£"], ["JPY", "¥"], ["NZD", "$"], ["BGN", "лв."], ["BRL", "R$"], ["CZK", "Kč"], ["DKK", "kr"], ["HKD", "$"], ["HRK", "kn"], ["HUF", "Ft"], ["IDR", "Rp"], ["ILS", "₪"], ["INR", "₹"], ["KRW", "₩"], ["MXN", "$"], ["MYR", "RM"], ["NOK", "kr"], ["PHP", "₱"], ["PLN", "zł"], ["RON", "lei"], ["RUB", "₽"], ["SEK", "kr"], ["SGD", "$"], ["THB", "฿"], ["TRY", "₺"], ["ZAR", "R"]]
   *   }
   * }
   */
  getExchangeRates(params = {}) {
    params.coins = (params.symbols ? params.symbols.join(',') : '')
    return this.doRequest('get', '/open/currencies', params)
  }

  /**
   * Retrieve a list of supported languages.
   * @access public
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getLanguages().then(console.log).catch(console.error)
   */
  getLanguages() {
    return this.doRequest('get', '/open/lang-list')
  }

  /**
   * Change the language for your account.
   * @access public
   * @param {{lang: string}} params The specific language locale to change to from the list provided by getLanguages.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.changeLanguage({
   *   lang: 'en_US'
   * }).then(console.log).catch(console.error)
   */
  changeLanguage(params = {}) {
    return this.doSignedRequest('post', '/user/change-lang', params)
  }

  /**
   * Get account information for the authenticated user.
   * @access public
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getUserInfo().then(console.log).catch(console.error)
   */
  getUserInfo() {
    return this.doSignedRequest('get', '/user/info')
  }

  /**
   * Get the number of invitees from the authenticated user's referral code.
   * @access public
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getInviteCount().then(console.log).catch(console.error)
   */
  getInviteCount() {
    return this.doSignedRequest('get', '/referrer/descendant/count')
  }

  /**
   * Get promotion reward info.
   * @access public
   * @param {{symbol: string}} [params] The coin's symbol to retrieve reward info for.
   * @return {Promise} An object containing the API response.
   * @example <caption>Specify a symbol:</caption>
   * kc.getPromotionRewardInfo({
   *   symbol: 'NEO'
   * }).then(console.log).catch(console.error)
   * @example <caption>Retrieve data for all symbols:</caption>
   * kc.getPromotionRewardInfo().then(console.log).catch(console.error)
   */
  getPromotionRewardInfo(params = {}) {
    params.coin = (params.symbol ? params.symbol : '')
    return this.doSignedRequest('get', '/account/' + (params.symbol != undefined ? params.symbol + '/' : '') + 'promotion/info', params)
  }

  /**
   * Get promotion reward summary.
   * @access public
   * @param {{symbol: string}} [params] The coin's symbol to retrieve reward summary for.
   * @return {Promise} An object containing the API response.
   * @example <caption>Specify a symbol:</caption>
   * kc.getPromotionRewardSummary({
   *   symbol: 'NEO'
   * }).then(console.log).catch(console.error)
   * @example <caption>Retrieve data for all symbols:</caption>
   * kc.getPromotionRewardSummary().then(console.log).catch(console.error)
   */
  getPromotionRewardSummary(params = {}) {
    params.coin = (params.symbol ? params.symbol : '')
    return this.doSignedRequest('get', '/account/' + (params.symbol != undefined ? params.symbol + '/' : '') + 'promotion/sum')
  }

  /**
   * Retrieve the deposit address for a particular coin.
   * @access public
   * @param {{symbol: string}} params The coin's symbol to retrieve an address for.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getDepositAddress({
   *   symbol: 'NEO'
   * }).then(console.log).catch(console.error)
   */
  getDepositAddress(params = {}) {
    return this.doSignedRequest('get', '/account/' + params.symbol + '/wallet/address')
  }

  /**
   * Create a withdrawal request for the specified coin.
   * @access public
   * @param {{symbol: string, amount: number, address: string}} params Withdrawal details including the coin's symbol, amount, and address to withdraw to.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.createWithdrawal({
   *   symbol: 'NEO',
   *   amount: 5,
   *   address: 'AWcAwoXK6gbMUTojHMHEx8FgEfaVK9Hz5s'
   * }).then(console.log).catch(console.error)
   */
  createWithdrawal(params = {}) {
    params.coin = params.symbol
    return this.doSignedRequest('post', '/account/' + params.symbol + '/withdraw/apply', params)
  }

  /**
   * Cancel a withdrawal request for the specified coin.
   * @access public
   * @param {{symbol: string, txOid: string}} params Withdrawal details including the coin's symbol and transaction ID for the withdrawal.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.cancelWithdrawal({
   *   symbol: 'NEO',
   *   txOid: '59fa71673b7468701cd714a1'
   * }).then(console.log).catch(console.error)
   */
  cancelWithdrawal(params = {}) {
    return this.doSignedRequest('post', '/account/' + params.symbol + '/withdraw/cancel', params)
  }

  /**
   * Retrieve deposit and withdrawal record history.
   * @access public
   * @param {{symbol: string, type: string, status: string, limit: number, page: number}} params Record details including the coin's symbol, type, status, limit, and page number for the records.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getDepositAndWithdrawalRecords({
   *   symbol: 'NEO',
   *   type: 'SELL'
   * }).then(console.log).catch(console.error)
   */
  getDepositAndWithdrawalRecords(params = {}) {
    return this.doSignedRequest('get', '/account/' + params.symbol + '/wallet/records', params)
  }

  /**
   * Retrieve balance for a particular coin.
   * @access public
   * @param {{symbol: string}} [params] The coin's symbol for the balance you want to retrieve.
   * @return {Promise} An object containing the API response.
   * @example <caption>Retrieve the balance for NEO:</caption>
   * kc.getBalance({
   *   symbol: 'NEO'
   * }).then(console.log).catch(console.error)
   * @example <caption>Retrieve the balance for all coins:</caption>
   * kc.getBalance().then(console.log).catch(console.error)
   */
  getBalance(params = {}) {
    return this.doSignedRequest('get', '/account/' + (params.symbol ? params.symbol + '/' : '') + 'balance')
  }

  /**
   * Create an order for the specified trading pair.
   * @access public
   * @param {{pair: string, amount: number, price: number, type: string}} params Order details including the trading pair, amount, price, and type of order.
   * @return {Promise} An object containing the API response.
   * @example <caption>Create an order to sell 5 GAS for NEO at the specified price:</caption>
   * kc.createWithdrawal({
   *   pair: 'GAS-NEO',
   *   amount: 5,
   *   price: 0.608004
   *   type: 'SELL'
   * }).then(console.log).catch(console.error)
   */
  createOrder(params = {}) {
    params.symbol = params.pair
    return this.doSignedRequest('post', '/order', params)
  }

  /**
   * View a list of active orders for the specified trading pair
   * @access public
   * @param {{pair: string}} params The trading pair to retrieve orders for.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getActiveOrders({
   *   pair: 'GAS-NEO'
   * }).then(console.log).catch(console.error)
   */
  getActiveOrders(params = {}) {
    params.symbol = params.pair
    return this.doSignedRequest('get', '/' + params.pair + '/order/active', params)
  }

  /**
   * Cancel an order for the specified trading pair.
   * @access public
   * @param {{pair: string, txOid: string}} params Order details including the trading pair and transaction ID for the order.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.cancelOrder({
   *   pair: 'GAS-NEO',
   *   txOid: '59fa71673b7468701cd714a1'
   * }).then(console.log).catch(console.error)
   */
  cancelOrder(params = {}) {
    params.symbol = params.pair
    return this.doSignedRequest('post', '/cancel-order', params)
  }

  /**
   * Retrieve a list of completed orders for the specified trading pair.
   * @access public
   * @param {{pair: string, type: string, limit: number, page: number}} params Order details including the trading pair, type, limit, and page number for the orders.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getDealtOrders({
   *   pair: 'GAS-NEO'
   * }).then(console.log).catch(console.error)
   */
  getDealtOrders(params = {}) {
    params.symbol = params.pair
    return this.doSignedRequest('get', '/' + params.pair + '/deal-orders', params)
  }

  /**
   * Retrieve current price ticker data for the specified trading pair.
   * @access public
   * @param {{pair: string}} params The trading pair to retrieve price ticker for.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getTicker({
   *   pair: 'GAS-NEO'
   * }).then(console.log).catch(console.error)
   */
  getTicker(params = {}) {
    return this.doRequest('get', '/' + params.pair + '/open/tick')
  }

  /**
   * Retrieve a list of orders for the specified trading pair.
   * @access public
   * @param {{pair: string, type: string, group: number, limit: number}} params Order book details including the trading pair, type, group, and limit for the orders.
   * @return {Promise} An object containing the API response.
   * @example <caption>Retrieve all orders currently on the books for the GAS-NEO trading pair:</caption>
   * kc.getOrderBooks({
   *   pair: 'GAS-NEO'
   * }).then(console.log).catch(console.error)
   * @example <caption>Retrieve only SELL orders currently on the books for the GAS-NEO trading pair:</caption>
   * kc.getOrderBooks({
   *   pair: 'GAS-NEO',
   *   type: 'SELL'
   * }).then(console.log).catch(console.error)
   */
  getOrderBooks(params = {}) {
    params.symbol = params.pair
    return this.doRequest('get', '/' + params.pair + '/open/orders' + (params.type ? '-' + params.type.toLowerCase() : ''), params)
  }

  /**
   * Retrieve a list of recently completed orders for the specified trading pair.
   * @access public
   * @param {{pair: string, limit: number, since: number}} params Order book details including the trading pair, limit, and since for the orders.
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getRecentlyDealtOrders({
   *   pair: 'GAS-NEO'
   * }).then(console.log).catch(console.error)
   */
  getRecentlyDealtOrders(params = {}) {
    return this.doRequest('get', '/' + params.pair + '/open/deal-orders', params)
  }

  /**
   * Retrieve a list of available trading pairs.
   * @access public
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getTradingSymbols().then(console.log).catch(console.error)
   */
  getTradingSymbols() {
    return this.doRequest('get', '/market/open/symbols')
  }

  /**
   * Retrieve a list of trending trading pairs.
   * @access public
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getTrending().then(console.log).catch(console.error)
   */
  getTrending() {
    return this.doRequest('get', '/market/open/coins-trending')
  }

  /**
   * Retrieve a list of available coins.
   * @access public
   * @return {Promise} An object containing the API response.
   * @example
   * kc.getCoins().then(console.log).catch(console.error)
   */
  getCoins() {
    return this.doRequest('get', '/market/open/coins-list')
  }

}

module.exports = Kucoin
