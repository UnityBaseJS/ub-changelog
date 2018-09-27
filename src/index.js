const parseChangelog = require('./parser.js')
const fs = require('fs')
const semver = require('semver')
const changeTypes = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

const groupingChangesInFile = (filePath, pkgName, previousVersion = '1.0.0') => {
  return parseChangelog(filePath).then(json => {
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
  })
}

const renderMD = (json) => {
  const result = []
  const renderPkg = ({ name, version, changeGroups, previousVersion }) => {
    if (Object.keys(changeGroups).length === 0) return ''
    const result = []
    result.push(`## Package ${name}@${previousVersion}->${version} ${previousVersion === '1.0.0' ? ' **New**' : ''}`)
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
  const promises = []
  const packageNames = fs.readdirSync('./packages')
  for (let packName of packageNames) {
    const changelogPath = `./packages/${packName}/CHANGELOG.md`
    if (fs.existsSync(changelogPath)) {
      promises.push(groupingChangesInFile(changelogPath, packName, config[packName]))
    }
  }
  Promise.all(promises)
    .then(allPacksChanges => {
      const newConfig = allPacksChanges.reduce((previousValue, currentValue) => {
        return { ...previousValue, [currentValue.name]: currentValue.version }
      }, {})
      const rendered = (renderMD(allPacksChanges))
      if (!fs.existsSync('./weekly_updates')) {
        fs.mkdirSync('./weekly_updates')
      }
      const date = new Date().toLocaleDateString('ru-RU')
      if (rendered !== '') {
        fs.appendFile(`./weekly_updates/global-changelog-${date}.md`, rendered, 'utf8', err => {
          if (err) throw err
          console.log('Changelog generate successfully')
        })
      } else {
        console.log('There is not new changes')
      }

      fs.writeFile('./weekly_updates/changelog.config.json', JSON.stringify(newConfig, null, 2), 'utf8', err => {
        if (err) throw err
        console.log('Config updated')
      })
    })
}
