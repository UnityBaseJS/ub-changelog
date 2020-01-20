var EOL = require('os').EOL
const fs = require('fs')

// patterns
var semver = /\[?v?([\w\d.-]+\.[\w\d.-]+[a-zA-Z0-9])]?/
var date = /.*[ ](\d\d?\d?\d?[-/.]\d\d?[-/.]\d\d?\d?\d?).*/
var subhead = /^###/
var listitem = /^[^#\n]../

function parseChangelog (file) {
  const data = {
    log: { versions: [] },
    current: null
  }
  const hl = handleLine.bind(data)

  fs.readFileSync(file).toString().split('\n').forEach(function (line) {
    hl(line)
  })

  pushCurrent(data)
  data.log.description = clean(data.log.description)
  if (data.log.description === '') delete data.log.description
  return data.log
}

function handleLine (line) {
  // skip line if it's a link label
  if (line.match(/^\[[^[\]]*] *?:/)) return

  // set title if it's there
  if (!this.log.title && line.match(/^# ?[^#]/)) {
    this.log.title = line.substring(1).trim()
    return
  }

  // skip unreleased
  if (line.match(/^## \[Unreleased]/)) return

  // new version found!
  if (line.match(/^## ?[^#]/)) {
    if (this.current && this.current.title) pushCurrent(this)

    this.current = versionFactory()

    if (semver.exec(line)) this.current.version = semver.exec(line)[1]

    this.current.title = line.substring(2).trim()

    if (this.current.title && date.exec(this.current.title)) this.current.date = date.exec(this.current.title)[1]

    return
  }

  // deal with body or description content
  if (this.current) {
    this.current.body += line + EOL

    // handle case where current line is a 'subhead':
    // - 'handleize' subhead.
    // - add subhead to 'parsed' data if not already present.
    if (subhead.exec(line)) {
      var key = line.replace('###', '').trim()

      if (!this.current.parsed[key]) {
        this.current.parsed[key] = []
        this.current._private.activeSubhead = key
      }
    }

    // handle case where current line is a 'list item':
    if (listitem.exec(line)) {
      // add line to 'catch all' array
      this.current.parsed._.push(line)

      // add line to 'active subhead' if applicable (eg. 'Added', 'Changed', etc.)
      if (this.current._private.activeSubhead) {
        this.current.parsed[this.current._private.activeSubhead].push(line)
      }
    }
  } else {
    this.log.description = (this.log.description || '') + line + EOL
  }
}

function versionFactory () {
  return {
    version: null,
    title: null,
    date: null,
    body: '',
    parsed: {
      _: []
    },
    _private: {
      activeSubhead: null
    }
  }
}

function pushCurrent (data) {
  // remove private properties
  delete data.current._private

  data.current.body = clean(data.current.body)
  data.log.versions.push(data.current)
}

function clean (str) {
  if (!str) return ''

  // trim
  // str = str.trim()
  // remove leading newlines
  // str = str.replace(new RegExp('[' + EOL + ']*'), '')
  // remove trailing newlines
  // str = str.replace(new RegExp('[' + EOL + ']*$'), '')

  return str
}

module.exports = parseChangelog
