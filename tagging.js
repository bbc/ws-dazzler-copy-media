const ISO6391 = require('iso-639-1');

let elasticSearch;

const map = {
  p0368zp2: 'arabic',
  p0368zp4: 'azeri',
  p0368zp5: 'chinese_simplified',
  p0368zp7: 'hindi',
  p0368zp8: 'indonesia',
  p0368zpb: 'mundo',
  p0368zpd: 'pashto',
  p0368zph: 'persian',
  p0368zpj: 'portuguese',
  p0368zpm: 'russian',
  p0368zpn: 'swahili',
  p0368zpq: 'turkish',
  p0368zpr: 'ukrainian',
  p0368zpt: 'urdu',
  p0368zpv: 'vietnamese',
  p0368zpx: 'afrique',
  p0368zpz: 'bengali',
  p0368zq0: 'burmese',
  p0368zq2: 'gahuza',
  p0368zq5: 'hausa',
  p0368zq6: 'kyrgyz',
  p0368zq8: 'nepali',
  p0368zqb: 'sinhala',
  p0368zqc: 'somali',
  p0368zqg: 'tamil',
  p0368zqk: 'uzbek',
  p03xnk4v: 'japanese',
  p04bm7hr: 'thai',
  p04gnztx: 'uk_chinese_simplified',
  p04q0c23: 'amharic',
  p04q0c24: 'korean',
  p04q0c25: 'marathi',
  p04q0c26: 'oromo',
  p04q0c28: 'tigrinya',
  p053n6wy: 'gujarati',
  p053n6wz: 'igbo',
  p053n6x8: 'pidgin',
  p053n6xl: 'telugu',
  p053n6xx: 'yoruba',
  p056k641: 'punjabi',
  p056k647: 'punjabi_pakistan',
  p056k64n: 'serbian',
  p07kth1w: 'bangla',
};

function tag2lang(tag) {
  return map[tag];
}

function lang2code(lang) {
  return ISO6391.getCode(lang);
}

async function getTag(pid) {
  const query = {
    _source: 'pips.tagging.application_of.link.pid',
    query: { match: {} },
  };
  query.query.match['pips.tagging.application_to.link.pid'] = pid;
  const r = await elasticSearch.find('tagging', query);
  if (r && r.hits && r.hits.hits.length > 0) {
    // eslint-disable-next-line no-underscore-dangle
    return r.hits.hits[0]._source.pips.tagging.application_of.link.pid;
  }
  return undefined;
}

exports.settings = (config) => {
  elasticSearch = config.elasticSearch;
};
exports.lang2code = lang2code;
exports.tag2lang = tag2lang;
exports.getTag = getTag;
