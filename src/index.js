const parseChangelog = require('./parser.js')
const fs = require('fs')
const path = require('path')
const semver = require('semver')
const changeTypes = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

const groupingChangesInFile = (filePath, pkgName, previousVersion = '1.0.0') => {
  const json = parseChangelog(filePath)
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

const isPackage = packagePath => fs.existsSync(
  path.isAbsolute(packagePath)
    ? packagePath
    : path.resolve(process.cwd(), packagePath, 'CHANGELOG.md')
)

const getPaths = (includePaths, excludePaths) => {
  //includePaths.push('.')
  const paths = []
  for (let includePath of includePaths) {
    if (isPackage(includePath) && !excludePaths.includes(includePath)) {
      paths.push(path.resolve(process.cwd(), includePath, 'CHANGELOG.md'))
    } else {
      console.log(includePath)

      const isDirectory = source => fs.lstatSync(source).isDirectory()
      const getDirectories = source =>
        fs.readdirSync(source).map(name => path.resolve(source, name)).filter(isDirectory)
      const packageNames = getDirectories(path.isAbsolute(includePath) ? includePath : path.resolve(process.cwd(), includePath))
      for (let packName of packageNames) {
        const changelogPath = path.resolve(process.cwd(), packName, 'CHANGELOG.md')
        console.log()
        if (!excludePaths.includes(packName) && fs.existsSync(changelogPath)) {
          paths.push(changelogPath)
        }
      }
    }
  }
  return paths
}

const generate = (config) => {
  const allPaths = getPaths(config.path.include, config.path.exclude)

  const allPacksChanges = allPaths.map(filePath => {
    const pkgName = path.basename(path.dirname(filePath))
    const previusVersion = config.versions[pkgName]
    return groupingChangesInFile(filePath, pkgName, previusVersion)
  })
  console.log(allPacksChanges)
  const renderedChanges = (renderMD(allPacksChanges))

  if (!fs.existsSync(path.resolve(process.cwd(), 'weekly_updates'))) {
    fs.mkdirSync(path.resolve(process.cwd(), 'weekly_updates'))
  }
  const date = new Date().toLocaleDateString('ru-RU')
  if (renderedChanges !== '') {
    try {
      fs.appendFileSync(path.resolve(process.cwd(), `weekly_updates/global-changelog-${date}.md`), renderedChanges, 'utf8')
      console.log('Changelog generate successfully')
    } catch (err) {
      console.error(err)
    }

    config.versions = allPacksChanges.reduce((previousValue, currentValue) => {
      const obj = {}
      obj[currentValue.name] = currentValue.version
      return Object.assign(previousValue, obj)
      // return { ...previousValue, [currentValue.name]: currentValue.version }
    }, {})
    try {
      fs.writeFileSync(path.resolve(process.cwd(), 'weekly_updates/changelog.config.json'), JSON.stringify(config, null, 2), 'utf8')
      console.log('Config updated')
    } catch (err) {
      console.error(err)
    }
  } else {
    console.log('There is not new changes')
  }
}

module.exports.generate = generate
