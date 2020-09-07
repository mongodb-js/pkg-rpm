'use strict'

const { promisify } = require('util')

const getDefaultsFromPackageJSON = require('./defaults')
const exec = promisify(require('child_process').exec)
const createTemplatedFile = require('./template')
const sanitizeName = require('./sanitize-name')
const readMetadata = require('./read-metadata')
const tmp = require('tmp-promise')
const wrap = require('word-wrap')
const debug = require('debug')
const fs = require('fs-extra')
const path = require('path')

const defaultLogger = debug('pkg-rpm')

tmp.setGracefulCleanup()

module.exports = async function (data) {
  const pkgRhel = new PackageRPM(data)

  await pkgRhel.generateDefaults()
  await pkgRhel.createStagingDir()
  await pkgRhel.createSpec()
  await pkgRhel.copyApplication()
  await pkgRhel.createPackage()
  await pkgRhel.writePackage()
}

module.exports.PackageRPM = PackageRPM

function PackageRPM (options) {
  if (!(this instanceof PackageRPM)) return new PackageRPM(options)

  this.logger = options.logger || defaultLogger
  this.version = options.version
  this.input = options.input
  this.arch = options.arch
  this.name = options.name
  this.dest = options.dest
  this.src = options.src
  this.packageName = `${this.name}-${this.version}`
}

/**
 * Create temporary directory where the contents of the package will live.
 *
 * Directory structure is as follows:
 *
 * pkg-rpm-tmpdirectory/ (created by this function)
 * ├── BUILD
 * │   └── provided_binary (will be copied over with this.copyApplication())
 * ├── BUILDROOT
 * ├── RPMS (this will contain the built RPM)
 * │   └── amd64 (current architecture directory)
 * │       └── packageName-version-arch.rpm (created by this.createPackage)
 * ├── SOURCES
 * ├── SPECS
 * │   └── module.spec (will be created with this.createSpec())
 * └── SRPMS
 */
PackageRPM.prototype.createStagingDir = async function () {
  this.logger('Creating staging directory')

  // keep this on the prototype, since we want to copy the packaged binary from
  // here at the end.
  this.dir = await tmp.dir({ prefix: 'pkg-rpm-', unsafeCleanup: true })
  // TODO: file name needs to be taken from opts
  this.stagingDir = this.dir.path
  await fs.ensureDir(this.stagingDir, '0755')
}

/**
 * Package everything in staginDir using `rpmbuild`. At this point stagingDir has
 * the binary in BUILD and SPEC files necessary to package a binary.
 */
PackageRPM.prototype.createPackage = async function () {
  this.logger(`Creating package at ${this.stagingDir}`)
  const output = await exec(`rpmbuild -bb ${this.specPath()} --target ${this.arch} --define "_topdir ${this.stagingDir}"`)

  this.logger('rpmbuild output:', output)
}

/**
 * Copies the created package that was written to tmp directory into the
 * provided destination.
 *
 * Uses .rpm that was written to this.stagingDir/RPMS/architecture/packageName by
 * rpmbuild command in this.createPackage().
 */
PackageRPM.prototype.writePackage = async function () {
  this.logger(`Copying package to ${this.dest}`)
  const outputPackage = path.join(this.dest, `${this.packageName}-${this.arch}.rpm`)
  await fs.copy(this.getRPMPath(), outputPackage)
}

/**
 * Copies the binary provided to PackageRPM as input into the staging directory.
 */
PackageRPM.prototype.copyApplication = async function () {
  this.logger(`Copying application to ${this.stagingDir}`)
  await fs.ensureDir(this.stagingDir, '0755')
  // binary file lives under /SOURCES.
  // This could potentially be gzipped before or after being added to /BUILD.
  const executable = path.join(this.stagingDir, 'BUILD', this.name)
  await fs.copy(this.input, executable)
  await fs.chmod(executable, 0o755)
}

/**
 * Creates the spec file for the package.
 *
 * See: https://fedoraproject.org/wiki/How_to_create_an_RPM_package
 */
PackageRPM.prototype.createSpec = async function () {
  const src = path.resolve(__dirname, '../resources/spec.ejs')
  const dest = path.join(this.stagingDir, 'SPECS', `${this.name}.spec`)
  this.logger(`Creating spec file at ${dest}`)

  return await createTemplatedFile(src, dest, this.options)
}

/**
 * Get the hash of default options for the pkgRpm. Some come from the info
 * read from `package.json`, and some are hardcoded.
 */
PackageRPM.prototype.generateDefaults = async function () {
  const pkg = await readMetadata({ src: this.src, logger: this.logger })

  this.options = Object.assign(getDefaultsFromPackageJSON(pkg), {
    version: normalizeVersion(this.version) || '0.0.0',
    arch: this.arch,
    compressionLevel: 2,
    // TODO: the next options should be accepted as params to PackageRPM
    pre: undefined,
    post: undefined,
    preun: undefined,
    postun: undefined
  })

  this.options.name = sanitizeName(this.options.name)

  if (!this.options.description && !this.options.productDescription) {
    throw new Error('No Description or ProductDescription provided. Please set a description in the project\'s package.json')
  }

  if (this.options.description) {
    // Do not end with a period
    this.options.description = this.options.description.replace(/\.*$/, '')
  }

  if (this.options.productDescription) {
    // Wrap the extended description to avoid rpmlint warning about
    // `description-line-too-long`.
    this.options.productDescription = wrap(this.options.productDescription, { width: 80, indent: '' })
  }

  return this.options
}

/**
 * Get path to a .spec file.
 *
 * this.stagingDir/SPECS
 */
PackageRPM.prototype.specPath = function () {
  return path.join(this.stagingDir, 'SPECS', `${this.options.name}.spec`)
}

/**
 * Get path to a built .rpm package lives.
 *
 * this.stagingDir/RPMS
 */
PackageRPM.prototype.getRPMPath = function () {
  return path.join(this.stagingDir, 'RPMS', this.arch, `${this.packageName}-1.${this.arch}.rpm`)
}

/**
 * Transform current version to a RPM SPEC compliant version.
 */
function normalizeVersion (version) {
  const adjustedVersion = version.replace(/[-]/g, '.')

  if (adjustedVersion !== version) {
    this.logger('Warning: replacing disallowed characters in version to comply with SPEC format.' +
      `Changing ${version} to ${adjustedVersion}`)
  }

  return adjustedVersion
}
