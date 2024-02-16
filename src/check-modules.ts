import * as ts from "typescript";
import * as fs from "fs";
import { printBanner } from "./banner/banner";

export interface ModulesDiff {
    removedDeclarations: string[],
    addedDeclarations: string[],
}

// Define an interface for command line arguments
interface CommandLineArgs {
    legacyFile: string;
    currentFile: string;
    // Add more properties if needed for other options
}

/**
 * Parses a TypeScript file to extract exported declarations.
 * @param {string} fileName - The path to the TypeScript file.
 * @returns {Set<string>} - A set of exported declarations.
 */
function parseFile(fileName: string): Set<string> {
    console.log(`==============================================================`);
    console.log(`                Parsing ${fileName}`);
    console.log(`==============================================================`);
    const program = ts.createProgram([fileName], {});
    const sourceFile = program.getSourceFile(fileName);

    if (!sourceFile) {
        throwFileNotFoundError(fileName);
    }

    const declarations = new Set<string>();

    function visit(node: ts.Node, namespace?: string) {
        if (ts.isModuleDeclaration(node) && ts.isIdentifier(node.name)) {
            const ns = namespace ? `${namespace}.${node.name.text}` : node.name.text;
            declarations.add(ns);
            if (node.body && ts.isModuleBlock(node.body)) {
                node.body.statements.forEach(childNode => visit(childNode, ns));
            }
        } else if (ts.isVariableStatement(node)) {
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                node.declarationList.declarations.forEach(declaration => {
                    if (declaration.name && ts.isIdentifier(declaration.name)) {
                        const fullyQualifiedName = namespace ? `${namespace}.${declaration.name.text}` : declaration.name.text;
                        declarations.add(fullyQualifiedName);
                        console.log("Exported Variable:: ", fullyQualifiedName);
                    }
                });
            }
        } else if (ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
            const name = node.name && ts.isIdentifier(node.name) ? node.name.text : "default";
            const fullyQualifiedName = namespace ? `${namespace}.${name}` : name;
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                declarations.add(fullyQualifiedName);
                console.log("Exported Symbol :: ", fullyQualifiedName);
            }
            if (ts.isInterfaceDeclaration(node)) {
                declarations.add(fullyQualifiedName);
                console.log("Interface :: ", fullyQualifiedName);
                if (node.members && node.members.length > 0) {
                    node.members.forEach(member => {
                        if (ts.isInterfaceDeclaration(member)) {
                            visit(member, fullyQualifiedName);
                        }
                    });
                }
            } else if (ts.isTypeAliasDeclaration(node)) {
                declarations.add(fullyQualifiedName);
                console.log("Type :: ", fullyQualifiedName);
            }
        }
    }

    ts.forEachChild(sourceFile!, visit);

    return declarations;
}

/**
 * Compares declarations between legacy and current TypeScript files and reports any deletions and additions.
 * @param {Set<string>} legacyDeclarations - Set of declarations from the legacy TypeScript file.
 * @param {Set<string>} currentDeclarations - Set of declarations from the current TypeScript file.
 */
 function compareDeclarations(legacyDeclarations: Set<string>, currentDeclarations: Set<string>): ModulesDiff {
    const diff: ModulesDiff = ({
        removedDeclarations: [],
        addedDeclarations: []
    });
    // const removedDeclarations: string[] = [];
    // const addedDeclarations: string[] = [];

    // Check for removed declarations
    legacyDeclarations.forEach(declaration => {
        if (!currentDeclarations.has(declaration)) {
            diff.removedDeclarations.push(declaration);
        }
    });

    // Check for added declarations
    currentDeclarations.forEach(declaration => {
        if (!legacyDeclarations.has(declaration)) {
            diff.addedDeclarations.push(declaration);
        }
    });

    return diff;
}

// if some declarations have been deleted print them
function printDeletedDeclarations(removedDeclarations: string[]): void {
    // throw an error if some declarations were deleted
    if (removedDeclarations.length > 0 ) {
        console.error(`----------------------------------------------------------------------------------`);
        console.error(`ERROR: Changes detected in ${argv.currentFile}!`);
        if (removedDeclarations.length > 0) {
            console.error('The following declarations were removed:');
            removedDeclarations.forEach(declaration => console.error('  -  ', declaration));
        }
        console.error(`----------------------------------------------------------------------------------`);
    }
}

// if some modules were added print them
function printAddedDeclarations(addedDeclarations: string[]) : void {
    console.error(`++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
    if (addedDeclarations.length > 0) {
        console.log('The following declarations were added:');
        addedDeclarations.forEach(declaration => console.error('  +  ', declaration));
    }
    console.error(`++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
}

/**
 * Checks if a file exists, throwing an error if it does not.
 * @param {string} fileName - The path to the file to check.
 */
function ensureFileExists(fileName: string): void {
    if (!fs.existsSync(fileName)) {
        throwFileNotFoundError(fileName);
    }
}

/**
 * Throws a "File not found" error.
 * @param {string} fileName - The name of the file that was not found.
 */
function throwFileNotFoundError(fileName: string): void {
    const fileNotFoundErrorMessage = `File not found: ${fileName}`;
    console.error(fileNotFoundErrorMessage);
    throw new Error(fileNotFoundErrorMessage);
}

/**
 * Parses command line arguments and executes the function to detect any deletions from the legacy file.
 * @param {CommandLineArgs} args - Command line arguments.
 */
function executeCommand(args: CommandLineArgs): void {
    console.log('Legacy File Path:', args.legacyFile);
    console.log('Current File Path:', args.currentFile);
    checkTypescriptFiles(args.legacyFile, args.currentFile);
}

/**
 * Compares declarations between the legacy and current TypeScript files.
 * @param {string} legacyFilePath - Path to the legacy TypeScript file.
 * @param {string} currentFilePath - Path to the current TypeScript file.
 */
function checkTypescriptFiles(legacyFilePath: string, currentFilePath: string): void {
    ensureFileExists(legacyFilePath);
    ensureFileExists(currentFilePath);
    const legacyDeclarations = parseFile(legacyFilePath);
    const currentDeclarations = parseFile(currentFilePath);
    const diff = compareDeclarations(legacyDeclarations, currentDeclarations);

    if(diff.removedDeclarations.length > 0) {
        printDeletedDeclarations(diff.removedDeclarations);
        process.exit(1); // Exit with Error code
    }

    // if new modules added exit with success and prepare new npm release
    if(diff.addedDeclarations.length > 0) {
        printAddedDeclarations(diff.addedDeclarations);
    }

    // No diff detected
    if(diff.addedDeclarations.length == 0 && diff.removedDeclarations.length == 0) {
        console.log(`No changes we detected`);
    }
    
    appendToGithubOtputFile("new_modules_added", diff.addedDeclarations.length > 0 ? "true" : "false");
}

function appendToGithubOtputFile(name: string, value: any): void {
    console.log(`appendToGithubOtputFile()`);
    if (process.env.GITHUB_OUTPUT) {
        console.log(`Apending ${name}=${value} to output file`);
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, { encoding: 'utf8' });
    }
}

printBanner();

// Import yargs
const argv: CommandLineArgs = require('yargs')
    .usage('Usage: node myScript.js --legacy-file [value] --current-file [value]')
    .option('legacy-file', {
        alias: 'l',
        describe: 'Path to the legacy index.d.ts file',
        demandOption: true,
        type: 'string'
    })
    .option('current-file', {
        alias: 'c',
        describe: 'Path to the current index.d.ts file',
        demandOption: true,
        type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .argv;

// Check if required arguments are provided
if (argv.legacyFile && argv.currentFile) {
    executeCommand(argv);
} else {
    console.log(JSON.stringify(argv));
    console.log("argv.legacyFilePath: ", argv.legacyFile, " argv.currentFilePath: ", argv.currentFile);
    const errorMsg = 'Please provide both --legacy-file and --current-file.';
    throw new Error(errorMsg);
}
