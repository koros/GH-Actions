# TypeScript Declarations Checker

This script compares exported declarations between two TypeScript files, typically a legacy file and a current file. It helps identify any declarations that have been removed from the current file compared to the legacy file.

## Prerequisites

Before running the script, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 10 or higher)
- [TypeScript](https://www.typescriptlang.org/) (install globally using `npm install -g typescript`)

## Installation

1. Clone this repository or download the script file (`check-modules.ts`).

2. Install dependencies by running the following command:

   ```bash
   npm install
   ```

## Build
Before running the script, you need to compile the TypeScript code to JavaScript. To do this, run the following command:

```bash
  npx tsc check-modules.ts
```
This will compile the TypeScript code in check-modules.ts to JavaScript and generate the `check-modules.js` file.

## Usage
Run the script using the following command:
```bash
node check-modules.js --legacy-file-path [path/to/legacy/file] --current-file-path [path/to/current/file]
```

### Usage in a Pipeline Environment
The script is designed to be used in a pipeline environment, such as GitHub Actions, to validate changes in the current branch before merging into the main branch.

Below is an example configuration for a GitHub Actions workflow script:

```yaml
name: Check Removed Interfaces, Types, and Export Declarations

on:
  pull_request:
    branches:
      - '*'

jobs:
  check-types:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout current branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}  # Checkout the current branch
          path: current_branch  # Store the contents in a directory named 'current_branch'

      - name: Checkout main branch
        uses: actions/checkout@v4
        with:
          sparse-checkout: | # checkout only index.d.ts file
            index.d.ts 
          sparse-checkout-cone-mode: false
          ref: main  # Checkout the main branch
          path: main_branch  # Store the contents in a directory named 'main_branch'

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '14'

      - name: Install dependencies
        working-directory: ./current_branch  # Switch working directory to 'current_branch'
        run: npm install

      - name: Compile TypeScript code
        working-directory: ./current_branch  # Switch working directory to 'current_branch'
        run: npx tsc check-modules.ts

      - name: Run TypeScript check
        run: |
          node current_branch/check-modules.js --current-file-path current_branch/index.d.ts --legacy-file-path main_branch/index.d.ts
```

This configuration checks for removed interfaces, types, and export declarations before merging a pull request into the main branch.

Replace [path/to/legacy/file] and [path/to/current/file] with the paths to your legacy and current TypeScript files, respectively.

## Command Line Options
- `--legacy-file-path` or `-l`: Path to the legacy TypeScript file containing the original declarations.
- `--current-file-path` or `-c`: Path to the current TypeScript file to compare against the legacy file.

## Example
```bash
node check-modules.js --legacy-file-path legacy/index.d.ts --current-file-path src/index.d.ts
```

## License
This project is licensed under the MIT License - see the LICENSE file for details.
