# make-me-a-content

`mmac` allows you to have templated sections in your source code and documentation.

It is heavily inspired by how [Rome](https://github.com/romefrontend/rome) generates docs and source code.

## Installation

```
npm install -D make-me-a-content
```

## Example

Let's take a look at a file in a project where there can be a large amount of files to be inserted.

```js
/* GENERATED_START(id:main;hash:sldkjflj425l26k45nl2kn54k6b2) This is generated content, do not modify by hand, to regenerate run "npm run build-docs" */
import foo from './things/foo.js';
import bar from './things/bar.js';

export const certainItems = {
    [foo.name]: foo,
    [bar.name]: bar,
}
/* GENERATED_END(id:main) */
```

Also the documentation where you need to reference the same items.

```md
Readme content

<!-- GENERATED_START(id:main;hash:sldkjflj425l26k45nl2kn54k6b2) This is generated content, do not modify by hand, to regenerate run "npm run build-docs" -->
| title          | description              | default value |
| :------------- | :----------------------: | ------------: |
|  Foo           | why you should use foo   |  default val  |
|  Bar           | why you should use bar   |  default val  |
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
    const thingsDirContents = await fs.promises.readDir('./path/to/things') // ['foo.js', 'bar.js']

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
        id: 'main',
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
        id: 'main',
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

If you wish to also prettify file using eslint/prettier or another tool, you can use the `transform` option.

```js
import {mmac} from 'make-me-a-content'
import prettier from 'prettier'

mmac({
    updateScript: 'npm run update-docs',
    filepath: './path/to/file.ext',
    lines: ['new content'],
    transform: (newContent) => prettier.format(newContent, {/* prettier options */})
})
```

## Options

- **filepath** path to a file to be updated
- **updateScript** script to be run in your project to regenerate content
- **lines** content to be put between the marks
- **id** to be user in content marks, optional, default `main`
- **hash** to be used in start mark
- **comments** add new comments by a file extension or overwride existing ones
- **transform** modify new file content
