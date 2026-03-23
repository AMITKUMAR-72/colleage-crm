import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(baseDir);
const tsxFiles = allFiles.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let errors = 0;

tsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /from ['"](\.?\..*?)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    
    // Resolve import path
    const fileDir = path.dirname(file);
    let resolvedPath = path.resolve(fileDir, importPath);
    
    // Support directory index imports
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        const indexFile = ['index.tsx', 'index.ts', 'index.js'].find(idx => fs.existsSync(path.join(resolvedPath, idx)));
        if (indexFile) resolvedPath = path.join(resolvedPath, indexFile);
    }

    // Support extensionless imports
    if (!fs.existsSync(resolvedPath)) {
        const ext = ['.tsx', '.ts', '.js', '.jsx'].find(e => fs.existsSync(resolvedPath + e));
        if (ext) resolvedPath = resolvedPath + ext;
    }

    if (fs.existsSync(resolvedPath)) {
        // Double check case sensitivity
        const dir = path.dirname(resolvedPath);
        const actualFiles = fs.readdirSync(dir);
        const basename = path.basename(resolvedPath);
        
        if (!actualFiles.includes(basename)) {
            console.error(`Case mismatch in ${file}:`);
            console.error(`  Imported: ${importPath}`);
            console.error(`  Resolved: ${basename}`);
            console.error(`  Case on disk: ${actualFiles.find(f => f.toLowerCase() === basename.toLowerCase())}`);
            errors++;
        }
    }
  }
});

if (errors === 0) {
  console.log("No case mismatches found.");
} else {
  console.log(`Found ${errors} case mismatches.`);
}
process.exit(errors > 0 ? 1 : 0);
