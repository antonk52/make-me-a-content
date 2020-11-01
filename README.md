# make-me-a-content
[![npm version](https://badge.fury.io/js/make-me-a-content.svg)](https://badge.fury.io/js/make-me-a-content)
[![install size](https://packagephobia.now.sh/badge?p=make-me-a-content)](https://packagephobia.now.sh/result?p=make-me-a-content)
[![Coverage Status](https://coveralls.io/repos/github/antonk52/make-me-a-content/badge.svg)](https://coveralls.io/github/antonk52/make-me-a-content)

`mmac` allows you to have templated sections in your source code and documentation.

It is heavily inspired by how [Rome](https://github.com/romefrontend/rome) generates docs and source code.

## Installation

```
npm install -D make-me-a-content
```

## Example

Let's take a look at a file where there can be a large amount of templated content. The imports and the exported object are extremely repetitive. It makes sense to generate this section to avoid human error.

```js
/* GENERATED_START(id:main;hash:sldkjflj425l26k45nl2kn54k6b2) This is generated content, do not modify by hand, to regenerate run "npm run build-docs" */
import bar from './things/bar.js'
import foo from './things/foo.js'

export const certainItems = {
    [bar.name]: bar,
    [foo.name]: foo,
}
/* GENERATED_END(id:main) */
```

Also the documentation where the same items need to be referenced.

```md
Readme content

<!-- GENERATED_START(id:main;hash:sldkjflj425l26k45nl2kn54k6b2) This is generated content, do not modify by hand, to regenerate run "npm run build-docs" -->
| title          | description              | default value |
| :------------- | :----------------------: | ------------: |
|  Bar           | why you should use bar   |  default val  |
|  Foo           | why you should use foo   |  default val  |
<!-- GENERATED_END(id:main) -->

More content
```

### Generation script

```js
// scripts/update-docs.js

import fs from 'fs'
import path from 'path'
import {mmac} from 'make-me-a-content'

async function updateScripts() {
    const thingsDirContents = await fs.promises.readdir('./path/to/things') // ['foo.js', 'bar.js']

    // --- Source code
    const newSourceCodeContent = [
        ...thingsDirContents.map(
            filename => `import ${path.parse(filename).name} from './${filename}'`
        ),
        '', // to have an empty line in the output
        `const certainItems = {`
        ...thingsDirContents.map(
            filename => `    [${path.parse(filename).name}.name]: ${path.parse(filename).name}},`
        ),
        `}`
    ]

    await mmac({
        filepath: './path/to/somefile.js',
        lines: newSourceCodeContent,
        updateScript: 'npm run update-docs',
    })

    // --- Documentation
    const modules = await thingsDirContents.map(filename => import(`./path/to/things/${filename}`))
    const newDocsContent = [
        '| title          | description              | default value |',
        '| :------------- | :----------------------: | ------------: |',
        ...modules.map(m => `| ${m.name} | ${m.description} | ${m.defaultValue} |`)
    ]

    await mmac({
        filepath: './path/to/README.md',
        lines: newDocsContent,
        updateScript: 'npm run update-docs',
    })
}

updateScripts()
```

### package.json

```json
{
    "name": "your project",
    "scripts": {
        "update-docs": "node ./scripts/update-docs",
        "start": "node ./src/index.js"
    }
}
```

## Usage

```js
import {mmac} from 'make-me-a-content'

mmac({
    updateScript: 'npm run update-docs',
    filepath: './path/to/file.ext',
    lines: ['new content', 'to be inserted', 'between', 'marks']
})
```

## Options

- **filepath** path to a file to be updated
- **updateScript** script to be run in your project to regenerate this section
- **lines** content to be put between the marks
- **id** to be user in content marks, optional, default is `main`
- **hash** to be used in start mark, optional, default is md5 hash generated from the lines
- **comments** add new comments by a file extension or overwrite existing ones
- **transform** modify the new file content

## FAQ

### The very first generation

Make sure you have added the start and end marks to the file where you want to insert the content. Ie

```js
/* GENERATED_START(id:main;hash) */
/* GENERATED_END(id:main) */
```

### How to format or prettify the content?

If you wish to also prettify file using eslint/prettier or another tool, you can use the `transform` option.

```js
import {mmac} from 'make-me-a-content'
import prettier from 'prettier'

mmac({
    updateScript: 'npm run update-docs',
    filepath: './path/to/file.ext',
    lines: ['new content'],
    transform: newContent => prettier.format(newContent, {/* prettier options */})
})
```

### How to have multiple templated sections in a single file?

To do that you can provide a different `id` per each section. The default one is `"main"`. Example:

```js
import {mmac} from 'make-me-a-content'

mmac({
    id: 'foo',
    updateScript: 'npm run update-docs',
    filepath: './path/to/file.ext',
    lines: ['foo content'],
})

mmac({
    id: 'bar',
    updateScript: 'npm run update-docs',
    filepath: './path/to/file.ext',
    lines: ['bar content'],
})
```

### Why is `updateScript` not optional?

Having the comment about the content being generated and the script to update it lowers the learning curve for people seeing it for the first time.

### Add or change comments for other file extensions

You can overwrite comments per file extension using the `comments` options

```js
mmac({
    comments: {
        // overwrite javascript comments to use single line comment
        ".js": {
            start: "// ",
            end: "",
        },
        // support lua files
        ".lua": {
            start: "-- ",
            end: "",
        },
    },
    // other mmac options
})
```
