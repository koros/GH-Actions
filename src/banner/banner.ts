import * as fs from 'fs';

// Define the file path
const filePath = './src/banner/banner.txt';

export function printBanner(): void {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    console.log("\n");
    console.log(fileContents);
    console.log("\n\n");
  } catch (err) {
    console.error(`Error reading file: ${err}`);
  }
}