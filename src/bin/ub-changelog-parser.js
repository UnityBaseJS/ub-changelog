#!/usr/bin/env node

const program = require('commander')
const { generate, checkErrors } = require('..')
const fs = require('fs')
const path = require('path')
const { dateFromYYYYMMDD } = require('../utils')
const nextYear = new Date().getFullYear() + 1
program
  .version('1.0.0')
  .description('Generate one changelog for the time period from all changelog\'s in monorepo.')
  .option('-p, --path <includePaths>', 'set paths to changelogs divided by ";"\nif not set get paths from `changelog.config.json`.')
  .option('-e, --exclude <excludePaths>', 'set paths to exclude divided by ";"\nif not set get paths from `changelog.config.json`.')
  .option('--from <fromDate>',
    'set older date for time range for changes in YYYY-MM-DD format\nif not set supposed to get log from first entry.',
    '1970-1-1')
  .option('--to <toDate>',
    'set newer date for time range for changes in YYYY-MM-DD format\nif not set supposed to get log to last entry.',
    `${nextYear}-1-1`)
  .option('-t, --test', 'dry run to test correctness of all changelogs.')
  .parse(process.argv)

let includePaths
let excludePaths

const configPath = path.resolve(process.cwd(), 'changelog.config.json')
const configExist = fs.existsSync(configPath)
let config = {}
if (configExist) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
}

if (!program.path) {
  if (!configExist) {
    console.log('Please set paths to find changelogs by `-p` or create `changelog.config.json`')
    return
  }

  if (!config.pathToPackages || !config.pathToPackages.include) {
    console.log('`changelog.config.json` must contain array with paths in pathToPackages.include')
    return
  }

  includePaths = config.pathToPackages.include
} else {
  includePaths = program.path.split(';')
}

if (!program.exclude) {
  if (!configExist) {
    return
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  if (!config.pathToPackages || !config.pathToPackages.exclude) {
    return
  }
  excludePaths = config.pathToPackages.exclude
} else {
  excludePaths = program.exclude.split(';')
}

if (program.test) {
  checkErrors(includePaths, excludePaths)
  return
}

const fromDate = dateFromYYYYMMDD(program.from)
const toDate = dateFromYYYYMMDD(program.to)
const generatedCL = generate(includePaths, excludePaths, fromDate, toDate, config.order)
if (generatedCL !== '') console.log(generatedCL)