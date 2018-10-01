#!/usr/bin/env node

const program = require('commander')
const { generate } = require('..')
const fs = require('fs')
const path = require('path')

program
  .version('0.0.5')
  .description('Generate changelog of changelogs')
  .option('-p, --path [path]', 'Set paths to changelogs divided by ;')
  .option('-d, --dest [path]', 'Set destination to output folder')
  .action(() => {
    let destPath
    if (program.dest) {
      if (!path.isAbsolute(program.dest)) {
        destPath = path.resolve(process.cwd(), program.dest)
      } else {
        destPath = program.dest
      }
    } else {
      destPath = path.resolve(process.cwd(), 'weekly_updates')
    }
    const config = fs.existsSync(path.resolve(destPath, 'changelog.config.json'))
      ? JSON.parse(fs.readFileSync(path.resolve(destPath, 'changelog.config.json')))
      : {
        'path': {
          'include': ['.'],
          'exclude': 'node_modules'
        },
        'versions': {}
      }
    generate(config, destPath)
  })
program.parse(process.argv)
