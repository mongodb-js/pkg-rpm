/**
 * Transform current version to a RPM SPEC compliant version.
 */

function normalizeVersion (version) {
  return version.replace(/[-]/g, '.')
}

module.exports = normalizeVersion
