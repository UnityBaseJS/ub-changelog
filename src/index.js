const parseChangelog = require('./parser.js')
const fs = require('fs')
const semver = require('semver')
const changeTypes = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

const groupingChangesInFile = (filePath, pkgName, previousVersion = '1.0.0') => {
  const json = parseChangelog(filePath)
  console.log(json)
  console.log(pkgName)
  // console.log(json.versions[0])
  const lastVersion = json.versions[0].version
  const changeGroups = json.versions
    .filter(({ version }) => {
      return semver.gt(version, previousVersion)
    })
    .reduce((prev, curr) => {
      for (let changeType of changeTypes) {
        if (curr.parsed[changeType]) {
          if (!prev[changeType]) prev[changeType] = []
          prev[changeType] = [...prev[changeType], ...curr.parsed[changeType]]
        }
      }
      return prev
    }, {})
  return {
    name: pkgName,
    version: lastVersion,
    previousVersion,
    changeGroups
  }
}

const renderMD = (json) => {
  const result = []
  const renderPkg = ({ name, version, changeGroups, previousVersion }) => {
    if (Object.keys(changeGroups).length === 0) return ''
    const result = []
    result.push(`## ${previousVersion === '1.0.0' ? '*New*' : ''} Package ${name}@${previousVersion}->${version}`)
    for (let changeType of changeTypes) {
      if (changeGroups[changeType]) {
        result.push(`### ${changeType}:`)
        for (const changes of changeGroups[changeType]) {
          result.push(changes)
        }
      }
    }
    return result.join('\n')
  }
  for (const pkg of json) {
    const render = renderPkg(pkg)
    if (render !== '') result.push(renderPkg(pkg))
  }
  return result.join('\n\n')
}

module.exports.generate = (config) => {
  const allPacksChanges = []
  const packageNames = fs.readdirSync('./packages')
  for (let packName of packageNames) {
    const changelogPath = `./packages/${packName}/CHANGELOG.md`
    if (fs.existsSync(changelogPath)) {
      allPacksChanges.push(groupingChangesInFile(changelogPath, packName, config[packName]))
    }
  }

  const newConfig = allPacksChanges.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue.name]: currentValue.version }
  }, {})
  const rendered = (renderMD(allPacksChanges))
  if (!fs.existsSync('./weekly_updates')) {
    fs.mkdirSync('./weekly_updates')
  }
  const date = new Date().toLocaleDateString('ru-RU')
  if (rendered !== '') {
    try {
      fs.appendFileSync(`./weekly_updates/global-changelog-${date}.md`, rendered, 'utf8')
      console.log('Changelog generate successfully')
    } catch (err) {
      console.error(err)
    }

    try {
      fs.writeFileSync('./weekly_updates/changelog.config.json', JSON.stringify(newConfig, null, 2), 'utf8')
      console.log('Config updated')
    } catch (err) {
      console.error(err)
    }
  } else {
    console.log('There is not new changes')
  }
}
