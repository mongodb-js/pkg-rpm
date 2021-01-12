const expect = require('chai').expect
const normalizeVersion = require('../src/normalize-version')

describe('normalizeVersion', () => {
  it('keeps an already good version unchanged', () => {
    expect(normalizeVersion('1.0.0')).to.equal('1.0.0')
  })

  it('normalize a semver preversion', () => {
    expect(normalizeVersion('1.0.0-pre.0')).to.equal('1.0.0.pre.0')
  })
})
