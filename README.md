# TypeScript Declaration Checker

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

