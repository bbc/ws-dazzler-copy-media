const https = require('https')
const axios = require('axios')
const fs = require('fs')

let options
try {
  options = {
    ca: fs.readFileSync('cosmos/trust.pem'),
    key: fs.readFileSync('cosmos/client.key'),
    cert: fs.readFileSync('cosmos/client.crt'),
    passphrase: 'client'
  }
} catch (e) {
  console.log('error fetching options to create axios client')
  console.log('the error was', e)
}
try {
  const agent = new https.Agent(options)
  module.exports.axios = axios.create({ httpsAgent: agent })
} catch (e) {
  console.log('error creating axios client - this is not dependent on any inputs')
  console.log('the error was', e)
}
