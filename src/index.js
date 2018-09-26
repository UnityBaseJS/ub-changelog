const parseChangelog = require('./parser.js')
const fs = require('fs')

const dirs = fs.readdir('./packages').then(packages => {
    for (let pkg of packages) {
      //todo
    }
  }
)

const groupChanges = (filePath) => {
  return new Promise((resolve, reject) => {
    const changeTypes = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']
    const changes = { 'Added': [], 'Changed': [], 'Deprecated': [], 'Removed': [], 'Fixed': [], 'Security': [] }
    parseChangelog(filePath).then(json => {
      const regroupChanges = json.versions.reduce((prev, curr) => {
        for (let changeType of changeTypes) {
          if (curr.parsed[changeType]) {
            prev[changeType] = [...prev[changeType], ...curr.parsed[changeType]]
          }
        }
        return prev
      }, changes)
      resolve(regroupChanges)
    })
  })
}
