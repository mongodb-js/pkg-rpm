const parseAuthor = require('parse-author')

/**
 * Determine the homepage based on the settings in `package.json`.
 */
module.exports = function getHomePage (pkg) {
  if (pkg.homepage) {
    return pkg.homepage
  } else if (pkg.author) {
    if (typeof pkg.author === 'string') {
      const url = parseAuthor(pkg.author).url || ''
      return url
    } else if (pkg.author.url) {
      return pkg.author.url
    }
  }

  return ''
}
