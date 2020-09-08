const { promisify } = require('util')

const glob = promisify(require('glob'))
const expect = require('chai').expect
const fs = require('fs-extra')
const packager = require('..')
const path = require('path')

const PackageRPM = packager.PackageRPM

const input = path.join(__dirname, 'fixtures', 'lilbins')
const dest = path.join(__dirname, 'fixtures', 'dist')
const src = path.join(__dirname, 'fixtures')
const output = path.join(dest, 'lilbins-0.0.1-x64.rpm')

describe('Packager', function () {
  this.timeout(30000)

  after(function () {
    fs.remove(output)
  })

  context('Packager default export', function () {
    it('writes rpm package to destination directory', async function () {
      const opts = {
        version: '0.0.1',
        name: 'lilbins',
        dest: dest,
        src: src,
        input: input,
        arch: 'x64'
      }

      await packager(opts)

      let accessErr
      try {
        await fs.access(output)
      } catch (e) {
        accessErr = e
      }
      // eslint-disable-next-line
      expect(accessErr).to.be.undefined
    })

    it('fails if input is not a string', async function () {
      const opts = {
        version: '0.0.1',
        name: 'lilbins',
        dest: dest,
        src: src,
        input: 25,
        arch: 'x64'
      }

      try {
        await packager(opts)
      } catch (e) {
        // different node versions have a different name for this, so just test
        // with .include
        expect(e.name).to.be.include('TypeError')
      }
    })
  })

  context('PackageRPM.prototype', function () {
    let pkgRhel

    before(() => {
      const opts = {
        version: '0.0.1',
        name: 'lilbins',
        dest: dest,
        src: src,
        input: input,
        arch: 'x64'
      }

      pkgRhel = new PackageRPM(opts)
    })

    it('creates an instance of PackageRPM', async function () {
      expect(pkgRhel).to.be.an.instanceOf(PackageRPM)
      expect(pkgRhel.version).to.equal('0.0.1')
      expect(pkgRhel.input).to.equal(input)
      expect(pkgRhel.arch).to.equal('x64')
      expect(pkgRhel.name).to.equal('lilbins')
      expect(pkgRhel.dest).to.equal(dest)
      expect(pkgRhel.src).to.equal(src)
      expect(pkgRhel.packageName).to.equal('lilbins-0.0.1')
    })

    it('PackageRPM.prototype.generateDefaults', async function () {
      const options = await pkgRhel.generateDefaults()
      const expectedOptions = {
        arch: 'x64',
        bin: 'lilbins',
        categories: [
          'GNOME',
          'GTK',
          'Utility'
        ],
        description: 'An example directory structure to work with pkg-rpm',
        genericName: 'lilbins',
        homepage: '',
        mimeType: [],
        post: undefined,
        postun: undefined,
        pre: undefined,
        compressionLevel: 2,
        execArguments: [],
        preun: undefined,
        name: 'lilbins',
        license: 'Apache-2.0',
        productDescription: 'An example directory structure to work with pkg-rpm',
        productName: 'lilbins',
        revision: undefined,
        version: '0.0.1'
      }
      expect(options).to.be.deep.equal(expectedOptions)
    })

    it('PackageRPM.prototype.createStagingDir', async function () {
      await pkgRhel.createStagingDir()
      const doesExist = await fs.pathExists(pkgRhel.stagingDir)
      // eslint-disable-next-line
      expect(doesExist).to.be.true
    })

    it('PackageRPM.prototype.copyApplication', async function () {
      await pkgRhel.createStagingDir()
      await pkgRhel.copyApplication()
      const doesExist = await fs.pathExists(path.join(pkgRhel.stagingDir, 'BUILD', pkgRhel.name))
      // eslint-disable-next-line
      expect(doesExist).to.be.true
    })

    it('PackageRPM.prototype.createSpec', async function () {
      await pkgRhel.createStagingDir()
      await pkgRhel.createSpec()
      const doesExist = await fs.pathExists(path.join(pkgRhel.stagingDir, 'SPECS/lilbins.spec'))
      // eslint-disable-next-line
      expect(doesExist).to.be.true
    })

    it('PackageRPM.prototype.createPackage', async function () {
      await pkgRhel.createStagingDir()
      await pkgRhel.createSpec()
      await pkgRhel.copyApplication()
      await pkgRhel.createPackage()
      const rpmFile = await glob(pkgRhel.getRPMPattern())
      const doesExist = await fs.pathExists(rpmFile[0])
      // eslint-disable-next-line
      expect(doesExist).to.be.true
    })
  })
})
