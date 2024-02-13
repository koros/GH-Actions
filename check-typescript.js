"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var fs = require("fs");
/**
 * Parses a TypeScript file to extract exported declarations.
 * @param {string} fileName - The path to the TypeScript file.
 * @returns {Set<string>} - A set of exported declarations.
 */
function parseFile(fileName) {
    console.log("==============================================================");
    console.log("                Parsing ".concat(fileName));
    console.log("==============================================================");
    var program = ts.createProgram([fileName], {});
    var sourceFile = program.getSourceFile(fileName);
    if (!sourceFile) {
        throwFileNotFoundError(fileName);
    }
    var declarations = new Set();
    function visit(node, namespace) {
        if (ts.isModuleDeclaration(node) && ts.isIdentifier(node.name)) {
            var ns_1 = namespace ? "".concat(namespace, ".").concat(node.name.text) : node.name.text;
            declarations.add(ns_1);
            if (node.body && ts.isModuleBlock(node.body)) {
                node.body.statements.forEach(function (childNode) { return visit(childNode, ns_1); });
            }
        }
        else if (ts.isVariableStatement(node)) {
            if (node.modifiers && node.modifiers.some(function (modifier) { return modifier.kind === ts.SyntaxKind.ExportKeyword; })) {
                node.declarationList.declarations.forEach(function (declaration) {
                    if (declaration.name && ts.isIdentifier(declaration.name)) {
                        var fullyQualifiedName = namespace ? "".concat(namespace, ".").concat(declaration.name.text) : declaration.name.text;
                        declarations.add(fullyQualifiedName);
                        console.log("Exported Variable:: ", fullyQualifiedName);
                    }
                });
            }
        }
        else if (ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
            var name_1 = node.name && ts.isIdentifier(node.name) ? node.name.text : "default";
            var fullyQualifiedName_1 = namespace ? "".concat(namespace, ".").concat(name_1) : name_1;
            if (node.modifiers && node.modifiers.some(function (modifier) { return modifier.kind === ts.SyntaxKind.ExportKeyword; })) {
                declarations.add(fullyQualifiedName_1);
                console.log("Exported Symbol :: ", fullyQualifiedName_1);
            }
            if (ts.isInterfaceDeclaration(node)) {
                declarations.add(fullyQualifiedName_1);
                console.log("Interface :: ", fullyQualifiedName_1);
                if (node.members && node.members.length > 0) {
                    node.members.forEach(function (member) {
                        if (ts.isInterfaceDeclaration(member)) {
                            visit(member, fullyQualifiedName_1);
                        }
                    });
                }
            }
            else if (ts.isTypeAliasDeclaration(node)) {
                declarations.add(fullyQualifiedName_1);
                console.log("Type :: ", fullyQualifiedName_1);
            }
        }
    }
    ts.forEachChild(sourceFile, visit);
    return declarations;
}
/**
 * Compares declarations between legacy and current TypeScript files and reports any deletions.
 * @param {Set<string>} legacyDeclarations - Set of declarations from the legacy TypeScript file.
 * @param {Set<string>} currentDeclarations - Set of declarations from the current TypeScript file.
 */
function compareDeclarations(legacyDeclarations, currentDeclarations) {
    var removedDeclarations = [];
    legacyDeclarations.forEach(function (declaration) {
        if (!currentDeclarations.has(declaration)) {
            removedDeclarations.push(declaration);
        }
    });
    if (removedDeclarations.length > 0) {
        console.error("===================================================================================");
        console.error("ERROR: Removed exported declarations detected in ".concat(argv.currentFilePath, "!"));
        console.error('The following declarations were removed:');
        removedDeclarations.forEach(function (declaration) { return console.error('    -- ', declaration); });
        console.error("===================================================================================");
        process.exit(1);
    }
}
/**
 * Checks if a file exists, throwing an error if it does not.
 * @param {string} fileName - The path to the file to check.
 */
function ensureFileExists(fileName) {
    if (!fs.existsSync(fileName)) {
        throwFileNotFoundError(fileName);
    }
}
/**
 * Throws a "File not found" error.
 * @param {string} fileName - The name of the file that was not found.
 */
function throwFileNotFoundError(fileName) {
    var fileNotFoundErrorMessage = "File not found: ".concat(fileName);
    console.error(fileNotFoundErrorMessage);
    throw new Error(fileNotFoundErrorMessage);
}
/**
 * Parses command line arguments and executes the function to detect any deletions from the legacy file.
 * @param {CommandLineArgs} args - Command line arguments.
 */
function executeCommand(args) {
    console.log('Legacy File Path:', args.legacyFilePath);
    console.log('Current File Path:', args.currentFilePath);
    checkTypescriptFiles(args.legacyFilePath, args.currentFilePath);
}
/**
 * Compares declarations between the legacy and current TypeScript files.
 * @param {string} legacyFilePath - Path to the legacy TypeScript file.
 * @param {string} currentFilePath - Path to the current TypeScript file.
 */
function checkTypescriptFiles(legacyFilePath, currentFilePath) {
    ensureFileExists(legacyFilePath);
    ensureFileExists(currentFilePath);
    var legacyDeclarations = parseFile(legacyFilePath);
    var currentDeclarations = parseFile(currentFilePath);
    compareDeclarations(legacyDeclarations, currentDeclarations);
}
// Import yargs
var argv = require('yargs')
    .usage('Usage: node myScript.js --legacy-file-path [value] --current-file-path [value]')
    .option('legacy-file-path', {
    alias: 'l',
    describe: 'Path to the legacy index.d.ts file',
    demandOption: true,
    type: 'string'
})
    .option('current-file-path', {
    alias: 'c',
    describe: 'Path to the current index.d.ts file',
    demandOption: true,
    type: 'string'
})
    .help('h')
    .alias('h', 'help')
    .argv;
// Check if required arguments are provided
if (argv.legacyFilePath && argv.currentFilePath) {
    executeCommand(argv);
}
else {
    var errorMsg = 'Please provide both --legacy-file-path and --current-file-path.';
    throw new Error(errorMsg);
}
