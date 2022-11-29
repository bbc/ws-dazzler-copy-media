/* eslint-disable no-undef */
const uut = require('./mediaSyndication');

describe('get', () => {
  it('should return nothing', () => {
    expect(uut.settings({ host: '', api_key: '', mediaset: '' })).toEqual(undefined);
  });
});
