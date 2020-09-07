const createTemplatedFile = require('../src/template')
const expect = require('chai').expect
const fs = require('fs-extra')
const path = require('path')

describe('createTemplatedFile', function () {
  const dest = path.join(__dirname, 'fixtures', 'dist', 'template')
  const templatePath = path.join(__dirname, '../resources/spec.ejs')

  afterEach(function () {
    fs.remove(dest)
  })

  it('writes template file', async function () {
    const data = {
      arch: undefined,
      bin: 'nori-pkg',
      execArguments: [],
      categories: [
        'GNOME',
        'GTK',
        'Utility'
      ],
      description: 'pkg for Nori-cat.',
      genericName: 'nori-pkg',
      version: '1.0.0',
      compressionLevel: 2,
      section: 'utils',
      priority: 'optional',
      size: '12.4',
      license: 'Apache-2.0',
      homepage: 'https://github.com/mongodb-js/pkg-rpm',
      pre: undefined,
      post: undefined,
      preun: undefined,
      postun: undefined,
      maintainer: 'Irina Shestak <shestak.irina@gmail.com>',
      name: 'nori-pkg',
      productDescription: 'A nice package for cat.',
      productName: 'nori-pkg',
      revision: undefined
    }

    await createTemplatedFile(templatePath, dest, data)
    expect(await fs.ensureFile.bind(fs.ensureFile, dest)).to.not.throw()
  })

  it('it throws when an option is missing', async function () {
    const data = {
      arch: undefined,
      bin: 'nori-pkg',
      execArguments: [],
      categories: [
        'GNOME',
        'GTK',
        'Utility'
      ],
      description: 'pkg for Nori-cat.',
      genericName: 'nori-pkg',
      version: '1.0.0',
      section: 'utils',
      priority: 'optional',
      size: '12.4',
      homepage: 'https://github.com/mongodb-js/pkg-rpm',
      license: 'Apache-2.0',
      compressionLevel: 2,
      pre: undefined,
      post: undefined,
      preun: undefined,
      postun: undefined,
      name: 'nori-pkg',
      productDescription: 'A nice package for cat.',
      productName: 'nori-pkg',
      revision: undefined
    }

    try {
      await createTemplatedFile(templatePath, dest, data)
    } catch (e) {
      expect(e.name).to.be.equal('ReferenceError')
    }
  })
})
