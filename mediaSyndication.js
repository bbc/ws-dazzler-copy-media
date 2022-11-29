const { axios } = require('./axios-cosmos');

let host = 'media-syndication.api.bbci.co.uk';
let apiKey = '';

module.exports = {
  async get(vpid) {
    console.log('media syndication', vpid);
    try {
      const response = await axios.get(`https://${host}/assets/pips-pid-${vpid}?mediaset=ws-partner-download&api_key=${apiKey}`);
      return response.data;
    } catch (e) {
      console.log('error in ms API', vpid, e);
    }
    return undefined;
  },
  settings(settings) {
    host = settings.host;
    apiKey = settings.api_key;
  },
};
