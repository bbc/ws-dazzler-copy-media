/* eslint-disable no-undef */
const uut = require('./elasticSearch');

const client = {};
client.index = jest.fn();
client.search = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

const b = ['w13xttt2'];
const s = ['w27vq4g8', 'p'];
const e = ['p085lv54'];

const qr = {
  hits: {
    total: 1,
    hits: [{ _source: { pips: {} } }],
  },
};
// eslint-disable-next-line no-underscore-dangle
const qrb = { ...qr }; qrb.hits.hits[0]._source.pips.brand = { pid: b[0] };
// eslint-disable-next-line no-underscore-dangle
const qrs = { ...qr }; qrs.hits.hits[0]._source.pips.series = { pid: s[0] };
// eslint-disable-next-line no-underscore-dangle
const qre = { ...qr }; qre.hits.hits[0]._source.pips.episode = { pid: e[0] };

describe('save', () => {
  it('should return "ok"', async () => {
    uut.settings(client);
    expect(await uut.save('', '', '')).toEqual(undefined);
  });
});

test('it should find missing', async () => {
  client.search.mockReturnValueOnce(qrs);
  uut.settings(client);
  expect(await uut.getMissing('series', s)).toEqual([s[1]]);
  expect(client.search).toBeCalledWith({
    index: 'series',
    body: {
      query: {
        terms: { 'pips.series.pid': s },
      },
      _source: 'pips.series.pid',
    },
  });
});
