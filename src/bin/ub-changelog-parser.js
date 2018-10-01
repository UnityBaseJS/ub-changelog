#!/usr/bin/env node

const program = require('commander')
const { generate } = require('..')
const fs = require('fs')
const path = require('path')
const config = fs.existsSync('weekly_updates/changelog.config.json')
  ? JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'weekly_updates/changelog.config.json')))
  : {
    'path': {
      // 'include': []
      'exclude': 'node_modules'
    },
    'versions': {}
  }

program
  .version('0.0.5')
  .description('Generate changelog of changelogs')
  .option('-p, --path [path]', 'Set paths to changelogs divided by ;')
  .action(() => generate(config))
program.parse(process.argv)
