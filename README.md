<p align="center">
  <img
    src="https://user-images.githubusercontent.com/30309816/31295829-c8d25310-ab2b-11e7-8885-fb335d0c3baf.png"
    width="125px;">
</p>

<h1 align="center">KuCoin API Client</h1>

<p align="center">
  A Node.js client for the [KuCoin](https://www.kucoin.com/) API.
</p>

## Overview

### What does it currently do

The [KuCoin API documentation](http://docs.kucoinapidocs.apiary.io/) is not too bad, though some holes and inconsistencies. This Node.js client attempts to make up for some of those. 25 of the 29 endpoints are supported, the missing ones are mainly relating to Kline data.

### Get help or give help

- Open a new [issue](https://github.com/Satoshinaire/kucoin-api/issues/new) if you encounter a problem.
- Or ping **@satoshinaire** on **Twitter**.
- Pull requests welcome.

## Getting started

### Installation

```
npm install --save kucoin-api
```

### Usage

```
'use strict'

require('dotenv').config()
const Kucoin = require('kucoin-api')

let kc = new Kucoin(process.env.KUCOIN_API_KEY, process.env.KUCOIN_API_SECRET)

kc.getBalance({
    symbol: 'GAS'
  })
  .then((result) => {
    console.log(result)
  })
  .catch((err) => {
    console.log(err)
  })
```

## License

- Open-source [MIT](https://github.com/Satoshinaire/kucoin-api/blob/master/LICENSE).
- Main author is [@satoshinaire](https://github.com/satoshinaire).

## Donations

NEO / GAS accepted at __AWcAwoXK6gbMUTojHMHEx8FgEfaVK9Hz5s__
