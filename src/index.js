const parseChangelog = require('./parser.js')
const fs = require('fs')
const path = require('path')
const semver = require('semver')
const changeTypes = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

const generate = (config, destPath) => {
  const escapeStringRegExp = str => {
    const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g
    return str.replace(matchOperatorsRe, '\\$&')
  }

  const excludeRegExp = new RegExp(escapeStringRegExp(config.path.exclude))
  const allPaths = getPaths(config.path.include, excludeRegExp)

  const allPacksChanges = allPaths.map(filePath => {
    const pkgName = path.basename(path.dirname(filePath))
    const previusVersion = config.versions[pkgName]
    return groupingChangesInFile(filePath, pkgName, previusVersion)
  })
  const renderedChanges = (renderMD(allPacksChanges))

  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath)
  }
  const date = new Date().toLocaleDateString('ru-RU')
  if (renderedChanges !== '') {
    try {
      fs.appendFileSync(path.resolve(destPath, `global-changelog-${date}.md`), renderedChanges, 'utf8')
      console.log('Changelog generate successfully')
    } catch (err) {
      console.error(err)
    }

    const newVersions = allPacksChanges.reduce((previousValue, currentValue) => {
      const obj = {}
      obj[currentValue.name] = currentValue.version
      return Object.assign(previousValue, obj)
    }, {})
    config.versions = Object.assign(config.versions, newVersions)
    try {
      fs.writeFileSync(path.resolve(destPath, 'changelog.config.json'), JSON.stringify(config, null, 2), 'utf8')
      console.log('Config updated')
    } catch (err) {
      console.error(err)
    }
  } else {
    console.log('There is not new changes')
  }
}

const getPaths = (includePaths = ['.'], excludePaths) => {
  const isPackage = packagePath => fs.existsSync(
    path.isAbsolute(packagePath)
      ? path.resolve(packagePath, 'CHANGELOG.md')
      : path.resolve(process.cwd(), packagePath, 'CHANGELOG.md')
  )

  const isDirectory = source => fs.lstatSync(source).isDirectory()
  const getDirectories = source =>
    fs.readdirSync(source).map(name => path.resolve(source, name)).filter(isDirectory)
  const paths = []
  for (let includePath of includePaths) {
    if (isPackage(includePath) && !excludePaths.test(includePath)) {
      paths.push(path.resolve(process.cwd(), includePath, 'CHANGELOG.md'))
    } else {
      const packageNames = getDirectories(path.isAbsolute(includePath) ? includePath : path.resolve(process.cwd(), includePath))
      for (let packName of packageNames) {
        if (isPackage(packName) && !excludePaths.test(includePath)) {
          const changelogPath = path.resolve(process.cwd(), packName, 'CHANGELOG.md')
          paths.push(changelogPath)
        } else {
          const newPackageNames = getDirectories(path.isAbsolute(includePath) ? path.resolve(includePath, packName) : path.resolve(process.cwd(), includePath, packName))
          for (let newPackName of newPackageNames) {
            const newChangelogPath = path.resolve(process.cwd(), newPackName, 'CHANGELOG.md')
            if (!excludePaths.test(newChangelogPath) && fs.existsSync(newChangelogPath)) {
              paths.push(newChangelogPath)
            }
          }
        }
      }
    }
  }
  return paths
}

const groupingChangesInFile = (filePath, pkgName, previousVersion = '0.0.1') => {
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
    result.push(`## ${previousVersion === '0.0.1' ? '*New*' : ''} Package ${name}@${previousVersion}->${version}`)
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

module.exports.generate = generate
