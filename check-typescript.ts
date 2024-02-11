import * as ts from "typescript";
import * as fs from "fs";

function parseFile(fileName: string) {
    const program = ts.createProgram([fileName], {});
    const sourceFile = program.getSourceFile(fileName);

    if (!sourceFile) {
        console.error(`File not found: ${fileName}`);
        return;
    }

    const namespaces: string[] = [];
    const exportedSymbols: string[] = [];
    const fullyQualifiedInterfacesAndTypes: string[] = [];

    function visit(node: ts.Node, namespace?: string) {
        if (ts.isModuleDeclaration(node) && ts.isIdentifier(node.name)) {
            const ns = namespace ? `${namespace}.${node.name.text}` : node.name.text;
            namespaces.push(ns);
            if (node.body && ts.isModuleBlock(node.body)) {
                node.body.statements.forEach(childNode => visit(childNode, ns));
            }
        } else if (ts.isVariableStatement(node)) {
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                node.declarationList.declarations.forEach(declaration => {
                    if (declaration.name && ts.isIdentifier(declaration.name)) {
                        const fullyQualifiedName = namespace ? `${namespace}.${declaration.name.text}` : declaration.name.text;
                        exportedSymbols.push(fullyQualifiedName);
                        console.log("Exported :: ", fullyQualifiedName);
                    }
                });
            }
        } else if (ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
            const name = node.name && ts.isIdentifier(node.name) ? node.name.text : "default";
            const fullyQualifiedName = namespace ? `${namespace}.${name}` : name;
            if (node.modifiers && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                exportedSymbols.push(fullyQualifiedName);
                console.log("Exported Symbol :: ", fullyQualifiedName);
            }
            if (ts.isInterfaceDeclaration(node)) {
                fullyQualifiedInterfacesAndTypes.push(fullyQualifiedName);
                console.log("Interface :: ", fullyQualifiedName);
                if (node.members && node.members.length > 0) {
                    node.members.forEach(member => {
                        if (ts.isInterfaceDeclaration(member)) {
                            visit(member, fullyQualifiedName);
                        }
                    });
                }
            } else if (ts.isTypeAliasDeclaration(node)) {
                fullyQualifiedInterfacesAndTypes.push(fullyQualifiedName);
                console.log("Type :: ", fullyQualifiedName);
            }
        }
    }

    ts.forEachChild(sourceFile, visit);

    console.log("Namespaces:", namespaces);
    console.log("Exported symbols:", exportedSymbols);
    console.log("Fully qualified interfaces and types:", fullyQualifiedInterfacesAndTypes);
}

function checkTypescriptFile(fileName: string) {
    if (!fs.existsSync(fileName)) {
        console.error(`File not found: ${fileName}`);
        return;
    }
    parseFile(fileName);
}

// Replace "example.ts" with your TypeScript file.
checkTypescriptFile("index.d.ts");
