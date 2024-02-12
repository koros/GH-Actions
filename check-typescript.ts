import * as ts from "typescript";
import * as fs from "fs";

function parseFile(fileName: string) : Set<string> {
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

    //console.log("Fully qualified interfaces and types:", declarations);
    return declarations;
}

function compareDeclarations(mainDeclarations: Set<string>, currentDeclarations: Set<string>): void {
    const removedDeclarations: string[] = [];
    mainDeclarations.forEach(declaration => {
        if (!currentDeclarations.has(declaration)) {
            removedDeclarations.push(declaration);
        }
    });

    if (removedDeclarations.length > 0) {
        console.error('Error: Removed exported declarations detected in index.d.ts!');
        console.error('The following declarations were removed:');
        removedDeclarations.forEach(declaration => console.error('-', declaration));
        process.exit(1);
    }
}

function checkTypescriptFile(mainBranchFileName: string, currentBranchFileName: string) {
    ensureFileExist(mainBranchFileName);
    ensureFileExist(mainBranchFileName);
    const mainDeclarations = parseFile(mainBranchFileName);
    const currentDeclarations = parseFile(currentBranchFileName);
    compareDeclarations(mainDeclarations, currentDeclarations);
}

function ensureFileExist(fileName: string): void {
    if (!fs.existsSync(fileName)) {
        throwFileNotFoundError(fileName);
    }
}

function throwFileNotFoundError(fileName: string): void {
    const fileNotFoundErrorMessage = `File not found: ${fileName}`;
    console.error(fileNotFoundErrorMessage);
    throw(fileNotFoundErrorMessage);
}

// Accessing command line arguments
const args = process.argv.slice(2); // The first two elements are 'node' and the path to the script file

// Check if we have enough arguments
if (args.length >= 2) {
    console.log(`Calling checkTypescriptFile with the following arguments`, args[0], args[1]);
    checkTypescriptFile(args[0], args[1]);
} else {
    const usageMessage = `Please provide 2 arguments \n e.g "node checktypescript main/index.d.ts index.d.ts" \n 
    the first argument is the path to the main index file and the second argument is the path to the current index file`;
    console.error(usageMessage);
    process.exit(1);
}