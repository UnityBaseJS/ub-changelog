### Ub-changelog
Set of tools for parse changelogs in multi-repo, and generate one from them

Changelogs searched in provided paths by glob `path{/*/,/}CHANGELOG.md`.
So expect `CHANGELOG.md` in provided folder or/and in one-depth subfolders.
### Config for cli
```json
{
  "pathToPackages": {
    "include": [
      "./packages",
      "../ub-server"
    ],
    "exclude": [
      "./packages/update-changelog/*",
      "../ub-server/package/*",
      "../ub-server/ubuntu/*"
    ]
  },
  "order": {
    "ub-server": 100,
    "@unitybase/adminui-vue": 50
  }
}
```

### Cli
Generate changelog and print it to console.  
Include and exclude paths gets from a config.
```shell script
ub-cl-gen
```

Test changelogs correctness for parse 
```shell script
ub-cl-gen -t
```

Set path from arguments
```shell script
ub-cl-gen -p './packages/ub;./packages/uba'
```

Set date range
```shell script
ub-cl-gen --from 2019-11-01 --to 2020-02-01
```

### API
```js
const { generate, checkErrors, getChangelogPaths, getParsedChangelogs, getParseErrors, renderToMD } = require('ub-changelog-parser')
```
Generating one changelog for all provided packages for date range
```js
const generatedCL = generate(includePaths, excludePaths, fromDate, toDate, order)
```

Checking correctness of all changelogs for parse
```js
checkErrors(includePaths, excludePaths)
```

Get paths to CHANGELOG.md directly inside provided paths or
in one level depth (and only one) sub-folder
```js
const pathsToChangelogs = getChangelogPaths(includePaths, excludePaths)
```

Parse all changelogs by their path's
```js
const parsedChangelogs = getParsedChangelogs(pathsToChangelogs)
```

Generate human-readable report with errors that occurred during parsing changelogs
```js
const errors = getParseErrors(parsedChangelogs)
```

Filtering by date, grouping by changes, filter and sorting
```js
const allPacksChanges = parsedChangelogs
  .map(cl => filterLogByDate(cl, fromDate, toDate))
  .map(cl => groupingChanges(cl))
  .filter(({ changes }) => changes.length > 0)
  .sort((a, b) => sortPackagesByNames(a.name, b.name, order))
```

Render grouped changelogs to markdown using mustache template
```js
const renderedChanges = renderToMD(allPacksChanges, templatePath)
```
