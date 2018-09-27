#!/usr/bin/env node

const program = require('commander')
const { generate } = require('..')
const fs = require('fs')

const config = (fs.existsSync('./weekly_updates/changelog.config.json'))
  ? JSON.parse(fs.readFileSync('./weekly_updates/changelog.config.json'))
  : {}

program
  .version('0.0.3')
  .description('Generate changelog of changelogs')
  .action(() => generate(config))
program.parse(process.argv)
