const parseChangelog = require('./parser.js')
const changeTypes = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

const changes = { 'Added': [], 'Changed': [], 'Deprecated': [], 'Removed': [], 'Fixed': [], 'Security': [] }
parseChangelog('CHANGELOG.md').then(json => {
  const groupChanges = json.versions.reduce((prev, curr) => {
    for (let changeType of changeTypes) {
      if (curr.parsed[changeType]) {
        prev[changeType] = [...prev[changeType], ...curr.parsed[changeType]]
      }
    }
    return prev
  }, changes)
})
