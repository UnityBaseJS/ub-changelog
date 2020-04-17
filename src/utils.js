const chalk = require('chalk')
const glob = require('glob')
const path = require('path')

const parseChangelog = require('./parser.js')
/**
 * @typedef {Object} Changelog - object with parsed changelog. Main info in `versions`
 * @property {string} pkgName - Name of package which changelog belong to
 * @property {Array.<Version>} versions - parsed changes grouped by package version
 * @property {Array.<string>} parseErrors - errors witch happen while parse changelog in string format
 */

/**
 * @typedef {Object} Version - object with parsed log to changes in some version. Main info in `parsed`
 * @property {string} version - version of package which log belong to in semver format
 * @property {string} title - title of log, possibly with version and date (like ## [1.0.10] - 2018-09-26)
 * @property {string} date - date of publish in yyyy-mm-dd format
 * @property {string} body - unparsed body of log (###Added ... ###Changed ...)
 * @property {Object} parsed - grouped by types changes
 */

/**
 * @typedef {Object} VersionsGroupedByChanges - object with parsed changelog, with few versions, but grouped by changes
 * @property {Array.<VersionWithOneTypeOfChanges>} Added
 * @property {Array.<VersionWithOneTypeOfChanges>} Changed
 * @property {Array.<VersionWithOneTypeOfChanges>} Deprecated
 * @property {Array.<VersionWithOneTypeOfChanges>} Removed
 * @property {Array.<VersionWithOneTypeOfChanges>} Fixed
 * @property {Array.<VersionWithOneTypeOfChanges>} Security
 */

/**
 * @typedef {Object} VersionWithOneTypeOfChanges - object with parsed log to changes in some version.
 * Difference from `Version` is that `VersionForGroupedByChanges` contain log only for one type of changes ('Added', 'Changed'...)
 * @property {string} version - version of package which log belong to in semver format
 * @property {string} date - date of publish in yyyy-mm-dd format
 * @property {Array.<string>} log - text of changes (only one type of changes ('Added', 'Changed'...))
 */

/**
 * Get paths to CHANGELOG.md directly inside provided paths or
 * in one level depth (and only one) sub-folder
 * @param {Array.<string>} includePaths
 * @param {Array.<string>} excludePaths
 * @returns {Array.<string>}
 */
const getChangelogPaths = (includePaths = ['.'], excludePaths = []) =>
  includePaths
    .map(path => `${path}{/*/,/}CHANGELOG.md`)
    // replace next two lines with ".flatMap(pattern => glob.sync(pattern))" when ES2019 flatMap will become widely used
    // https://node.green/#ES2019-features-Array-prototype--flat--flatMap-
    .map(pattern => Array.from(glob.sync(pattern, { ignore: excludePaths })))
    .reduce((acc, paths) => acc.concat(paths))

/**
 * Parse all changelogs by their path's
 * @param {Array.<string>} pathsToChangelogs
 * @returns {Array.<Changelog>}
 */
const getParsedChangelogs = pathsToChangelogs =>
  pathsToChangelogs.map(filePath => {
    const pkgName = path.basename(path.dirname(filePath))
    const { versions, parseErrors } = parseChangelog(filePath)
    return { pkgName, versions, parseErrors }
  })
/**
 * Generate human-readable report with errors that occurred during parsing changelogs
 * return '' if no one error happen
 * @param {Array.<Changelog>} parsedChangelogs
 * @returns {string}
 */
const getParseErrors = parsedChangelogs =>
  parsedChangelogs
    .filter(({ parseErrors }) => parseErrors.length > 0)
    .map(({ pkgName, parseErrors }) => {
      return chalk`Problem(s) with parsing {bold ${pkgName}}:` +
        parseErrors.join('\n')
    })
    .join('\n\n\n')

/**
 * Filter package versions by date range. For 'toDate' comparison is not strict.
 * @param {Changelog} changelog - parsed changelog
 * @param {Date} fromDate - older date. If not set supposed to get log from first entry
 * @param {Date} toDate - newer date. If not set supposed to get to last entry. Comparison is not strict
 * @returns {Changelog}
 */
const filterLogByDate = (changelog, fromDate = new Date(1970, 1, 1), toDate = new Date()) => {
  const versions = changelog.versions.filter(({ date: stringDate }) => {
    const date = dateFromYYYYMMDD(stringDate)
    return date >= fromDate && date < toDate
  })
  return { ...changelog, versions }
}

/**
 * Grouping Array.<ParsedVersion> in changelog by changeTypes
 * @param {Changelog} changelog - parsed changes grouped by package version
 * @return {Object}
 */
const groupingChanges = changelog => {
  const versionsGroupedByChanges = {
    Added: [],
    Changed: [],
    Deprecated: [],
    Removed: [],
    Fixed: [],
    Security: []
  }
  for (const version of changelog.versions) {
    const types = Object.keys(version.parsed).filter(key => key !== '_')
    for (const changeType of types) {
      versionsGroupedByChanges[changeType].push({
        version: version.version,
        date: version.date,
        log: version.parsed[changeType]
      })
    }
  }
  const versions = filterEmptyArrayProperties(versionsGroupedByChanges)
  return { ...changelog, versions }
}

/**
 * Convert VersionWithOneTypeOfChanges to string in markdown format
 * @param {string} version
 * @param {string} date
 * @param {Array.<string>} log
 * @return {string}
 */
const renderVersion = ({ version, date, log }) => {
  return `###### ~${version}~ ~${date}~ \n${log.join('\n')}`
}

const renderGroupedPkg = ({ pkgName, versions }) => {
  const renderedVers = Object.entries(versions)
    .map(([changeType, vers]) => `#### ${changeType}\n` + vers.map(renderVersion).join('\n') + '\n')
    .join('\n')
  return `## ${pkgName}\n${renderedVers}\n`
}

/**
 * Render grouped changelogs to markdown
 * @param {Array} changelogs
 * @return {string}
 */
const renderToMD = changelogs =>
  changelogs.map(renderGroupedPkg).join('\n')

/**
 * Convert date in yyyy-mm-dd format to js Date object
 * @param {string} stringDate
 * @returns {Date}
 */
const dateFromYYYYMMDD = stringDate => {
  const [y, m, d] = stringDate.split('-')
  return new Date(Number(y), m - 1, Number(d))
}

/**
 * Filter empty array properties in object
 * @param {Object} object
 * @return {Object}
 */
const filterEmptyArrayProperties = object => {
  const filteredObj = {}
  for (const key of Object.keys(object)) {
    if (!Array.isArray(object[key]) || object[key].length !== 0) {
      filteredObj[key] = object[key]
    }
  }
  return filteredObj
}

module.exports = {
  getChangelogPaths,
  getParsedChangelogs,
  getParseErrors,
  filterLogByDate,
  groupingChanges,
  renderToMD,
  dateFromYYYYMMDD
}
