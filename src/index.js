const {
  getChangelogPaths, getParsedChangelogs,
  getParseErrors, filterLogByDate,
  groupingChanges, renderMD
} = require('./utils')

/**
 * Generating one changelog for all provided packages for date range
 * @param {Array.<string>} includePaths
 * @param {Array.<string>} excludePaths
 * @param {Date} fromDate
 * @param {Date} toDate
 */
const generate = (includePaths, excludePaths, fromDate = new Date(1970, 1, 1), toDate = new Date()) => {
  const pathsToChangelogs = getChangelogPaths(includePaths, excludePaths)
  const parsedChangelogs = getParsedChangelogs(pathsToChangelogs)
  const errors = getParseErrors(parsedChangelogs)
  if (errors !== '') {
    console.error(errors)
    throw new Error('Parse errors')
  }
  const allPacksChanges = parsedChangelogs.map(cl => groupingChanges(filterLogByDate(cl, fromDate, toDate)))

  const renderedChanges = renderMD(allPacksChanges)
  return renderedChanges
}
/**
 * Checking correctness of all changelogs
 * @param includePaths
 * @param excludePaths
 */
const checkErrors = (includePaths, excludePaths) => {
  const pathsToChangelogs = getChangelogPaths(includePaths, excludePaths)
  const parsedChangelogs = getParsedChangelogs(pathsToChangelogs)
  const errors = getParseErrors(parsedChangelogs)
  if (errors === '') {
    console.log('No errors.')
  } else {
    console.error(errors)
    throw new Error('Parse errors')
  }
}

module.exports = { generate, checkErrors }
