#rd-dlux

This repository uses [yarn workspaces](https://yarnpkg.com/features/workspaces)

[![Tests](https://github.com/salesforce-ux/rd-dlux/actions/workflows/tests.yml/badge.svg)](https://github.com/salesforce-ux/rd-dlux/actions/workflows/tests.yml) [![Test Coverage Reports](https://github.com/salesforce-ux/rd-dlux/actions/workflows/tests-coverage.yml/badge.svg)](https://sturdy-doodle-9d09f9e5.pages.github.io/coverage/index.html)

## Installation

`yarn add @rd-dlux@salesforce-ux/rd-dlux` to get `"@rd-dlux": "salesforce-ux/rd-dlux",` in your package.json dependencies.

```
import { array } from '@rd-dlux/utils/array.js';
```

You must use the `@` in front, eg: `@rd-dlux`. Otherwise, certain `import` processes withing `jest` etc may not work properly.
_NOTE:_ This means that you can not install the package using npm like: `npm install @rd-dlux@salesforce-ux/rd-dlux` because it will freak out about the `@` at the beginning. If you do not want to use yarn, you will have to manually add the `@rd-dlux` dependency inside of package.json.

### Specific Versions

Because rd-dlux is not present in the npm registry, we are not able to do all of the normal "pinning" etc, with `^`, and `~`, etc. The only thing available to us it to "pin" to certain tags, hashes, or commits:

`yarn add @rd-dlux@salesforce-ux/rd-dlux#1.1.3` = `"@rd-dlux": "salesforce-ux/rd-dlux#1.1.3"`

### Using @rd-dlux as dependency

The a-typical way in which @rd-dlux is implemented (not as a "real" package, and also not compiled, and also as a private repo) presents some challenges when setting things like Github Workflows and Jest unit tests up.

#### Svelte

If you are using Svelte with Typescript integrations, you will need to make sure to configure it correctly.

##### tsconfig.json

Make sure that you tell typescript to compile @rd-dlux into the build:

```
{
	"extends": "./.svelte-kit/tsconfig.json",
	"include": ["./node_modules/@rd-dlux/**/*.js", "./node_modules/@rd-dlux/**/*.ts"]
}
```

##### import statements need .js

You must include the `.js` extension on your import statements, or else the tests & the build will not work (although the dev server will, confusingly, work just fine)

```
import { capitalize } from '@rd-dlux/utils/string.js';
```

#### Jest configuration

Some special attention will need to be paid when setting up Jest testing in a repo that requires @rd-dlux as a dependency. [This example repository](https://github.com/cmcculloh/jest-import) contains a detailed example.

In short: Jest needs to know to compile @rd-dlux within `node_modules`. You tell Jest to do this by [overwriting the default `transformIgnorePatterns` from within jest.config.js](https://github.com/cmcculloh/jest-import/blob/master/README.md#jestconfigjson):

```
{
    "transformIgnorePatterns": [
        "node_modules/(?!(npm-package|names|go-here)/)"
    ]
}
```

#### Unit Testing with Jest from a Github Workflow

Trying to run `yarn install` from within the Docker container that Github workflow provides will fail on the `@rd-dlux` install because the Docker container can not see the private rd-dlux repo.

The only way I found that I could fix this was to re-add @rd-dlux as a dependency, but using a PAT (Personal Access Token) in the dependency URL itself. This requires providing the PAT as a secret environment variable so that we don't have to commit the PAT to the implementing Github repo. The biggest snag in all of this was step 3.1 below, telling YAML _not_ to cache credentials (it ignored the PAT otherwise). The steps required were as follows:

1. [Create a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with read access to the private rd-dlux repository. (This just gets created right on your github user account, not on the implementing repository itself)
   1. [This repository](https://github.com/salesforce-ux/rd-dlux-dependency-test) can serve as a test-bed to test your PAT if you are having trouble and want to confirm the PAT isn't the problem.
2. Create a new [repository secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets) from within the repo whose workflow is trying to access rd-dlux dependency.
3. [Use the secret](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onworkflow_callsecrets) from within the YML file.
   1. _IMPORTANT_ Make sure you [do not persist credentials](https://stackoverflow.com/questions/59644303/install-an-npm-module-from-a-private-github-repository-using-github-actions)

Your final workflow YAML file will look something like this:

```
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    environment: workflow
    strategy:
      matrix:
        node-version: [14.x]

    steps:
      - uses: actions/checkout@v2
        with:
          persist-credentials: false
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node-version }}
      - run: yarn add @rd-dlux@git+https://${{ secrets.YARN_INSTALL_TOKEN }}@github.com/salesforce-ux/rd-dlux.git
      - run: yarn install
```

The relevant parts being:

Under the `actions/checkout` step:

```
        with:
          persist-credentials: false
```

And then replacing the `@rd-dlux` dependency before running `yarn install`

```
      - run: yarn add @rd-dlux@git+https://${{ secrets.YARN_INSTALL_TOKEN }}@github.com/salesforce-ux/rd-dlux.git
```

##### Committing from gh workflow
If you are using `persist-credentials: false` from a gh workflow, then `EndBug/add-and-commit` will fail, unless you pass your `GITHUB_TOKEN` in an `ENV` variable, like so:
```
            - name: Commit build (for ghpages)
              uses: EndBug/add-and-commit@v4
              with:
                  add: src docs
                  force: true
                  message: Commits formatting to src/ and build to docs/
              env:
                  GITHUB_TOKEN: ${{ secrets.YARN_INSTALL_TOKEN }}
```

##### Yarn install from within a subdirectory (for Github workflow)

If, as in some sort of "mono-repo", you are trying to install `@rd-dlux` from within a sub-directory, you will need to run the `yarn add` and `yarn install` commands from within a specific directory, like so:

```
      - run: yarn add @rd-dlux@git+https://${{ secrets.YARN_INSTALL_TOKEN }}@github.com/salesforce-ux/rd-dlux.git
        working-directory: tiles/scripting/ctas
      - run: yarn install
        working-directory: tiles/scripting/ctas
```

## Development

### .d.ts files

Many modules have a build script that will generate .d.ts files. After you make changes, run `yarn build:definitions` to update definitions. If the module does not have this yet, and you change it (or need it), then please add it.

TODO: Make Github Workflow that automatically re-builds these on PR merge.
# minimum-for-bug
