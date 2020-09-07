/**
 * Sanitize package name.
 */
module.exports = function sanitizeName (name) {
  const sanitized = replaceScopeName(name.toLowerCase(), '-').replace(new RegExp('[^-._+a-zA-Z0-9]', 'g'), '-')

  return sanitized
}

/**
 * Normalizes a scoped package name for use as an OS package name.
 *
 * @param {?string} [name=''] - the Node package name to normalize
 * @param {?string} [divider='-'] - the character(s) to replace slashes with
 */
function replaceScopeName (name, divider) {
  return name.replace(/^@/, '').replace('/', divider)
}
