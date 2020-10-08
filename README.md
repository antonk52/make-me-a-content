# make-me-a-content

This package helps with templated content generation for your docs/source code. It is heavily inspired by how [Rome](https://github.com/romefrontend/rome) generates docs and source code.

## Installation

```
npm install -D make-me-a-content
```

## Usage

```js
import {mmac} from 'make-me-a-content'

mmac({
    upageScript: 'npm run update-docs',
    filepath: './path/to/file.ext',
    lines: ['new content', 'to be inserted', 'between', 'marks']
})
```

If you wish to also prettify file using eslint/prettier or another tool, you can use the `transform` option.

```js
import {mmac} from 'make-me-a-content'
import prettier from 'prettier'

mmac({
    upageScript: 'npm run update-docs',
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
