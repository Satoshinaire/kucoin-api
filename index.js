'use strict'

const clients = require('restify-clients')
const crypto = require('crypto')
const Q = require('q')

class Kucoin {

  constructor(apiKey, apiSecret) {
    this._apiKey = apiKey
    this._apiSecret = apiSecret
    this.client = clients.createJsonClient({
      url: 'https://api.kucoin.com'
    })
    this.path_prefix = '/v1'
  }

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

  getSignature(path, queryString, nonce) {
    let strForSign = path + '/' + nonce + '/' + queryString
    let signatureStr = new Buffer(strForSign).toString('base64')
    let signatureResult = crypto.createHmac('sha256', this._apiSecret)
      .update(signatureStr)
      .digest('hex')
    return signatureResult
  }

  doRequest(method, endpoint, params) {
    return this.rawRequest(method, endpoint, false, params)
  }

  doSignedRequest(method, endpoint, params) {
    return this.rawRequest(method, endpoint, true, params)
  }

  getExchangeRates(params = {}) {
    params.coins = (params.symbols ? params.symbols.join(',') : '')
    return this.doRequest('get', '/open/currencies', params)
  }

  getLanguages() {
    return this.doRequest('get', '/open/lang-list')
  }

  changeLanguage(params = {}) {
    return this.doSignedRequest('post', '/user/change-lang', params)
  }

  getUserInfo() {
    return this.doSignedRequest('get', '/user/info')
  }

  getInviteCount() {
    return this.doSignedRequest('get', '/referrer/descendant/count')
  }

  getPromotionRewardInfo(params = {}) {
    params.coin = (params.symbol ? params.symbol : '')
    return this.doSignedRequest('get', '/account/' + (params.symbol != undefined ? params.symbol + '/' : '') + 'promotion/info', params)
  }

  getPromotionRewardSummary(params = {}) {
    params.coin = (params.symbol ? params.symbol : '')
    return this.doSignedRequest('get', '/account/' + (params.symbol != undefined ? params.symbol + '/' : '') + 'promotion/sum')
  }

  getDepositAddress(params = {}) {
    return this.doSignedRequest('get', '/account/' + params.symbol + '/wallet/address')
  }

  createWithdrawal(params = {}) {
    params.coin = params.symbol
    return this.doSignedRequest('post', '/account/' + params.symbol + '/withdraw/apply', params)
  }

  cancelWithdrawal(params = {}) {
    return this.doSignedRequest('post', '/account/' + params.symbol + '/withdraw/cancel', params)
  }

  getDepositAndWithdrawalRecords(params = {}) {
    return this.doSignedRequest('get', '/account/' + params.symbol + '/wallet/records', params)
  }

  getBalance(params = {}) {
    return this.doSignedRequest('get', '/account/' + (params.symbol ? params.symbol + '/' : '') + 'balance')
  }

  createOrder(params = {}) {
    return this.doSignedRequest('post', '/order', params)
  }

  getActiveOrders(params = {}) {
    return this.doSignedRequest('get', '/' + params.pair + '/order/active', params)
  }

  cancelOrder(params = {}) {
    return this.doSignedRequest('post', '/cancel-order', params)
  }

  getDealtOrders(params = {}) {
    return this.doSignedRequest('get', '/' + params.pair + '/deal-orders', params)
  }

  getTicker(params = {}) {
    return this.doRequest('get', '/' + params.pair + '/open/tick')
  }

  getOrderBooks(params = {}) {
    return this.doRequest('get', '/' + params.pair + '/open/orders', params)
  }

  getBuyOrderBooks(params = {}) {
    return this.doRequest('get', '/' + params.pair + '/open/orders-buy', params)
  }

  getSellOrderBooks(params = {}) {
    return this.doRequest('get', '/' + params.pair + '/open/orders-sell', params)
  }

  getRecentlyDealtOrders(params = {}) {
    return this.doRequest('get', '/' + params.pair + '/open/deal-orders', params)
  }

  getTradingSymbols() {
    return this.doRequest('get', '/market/open/symbols')
  }

  getTrending() {
    return this.doRequest('get', '/market/open/coins-trending')
  }

  getCoins() {
    return this.doRequest('get', '/market/open/coins-list')
  }

}

module.exports = Kucoin
