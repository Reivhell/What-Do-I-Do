import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const ROOT = '/home/sejel/Documents/what do i do/server/src';

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (extname(full) === '.ts') {
      files.push(full);
    }
  }
  return files;
}

const files = walk(ROOT);

let totalFixed = 0;
for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let fixed = 0;
  
  // Fix relative imports without .js extension
  // Match: from './something' or from '../something' 
  // But not: from './something.js' or from '../something.js'
  // And not: from 'package-name' (non-relative)
  // And not: from './something.ts' (shouldn't exist but just in case)
  
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Match import/export statements with relative paths without .js extension
    const importMatch = line.match(/^(\s*(?:import|export)\s+(?:.*?\s+)?from\s+['"])(\.[^'"]+)(['"])/);
    if (importMatch) {
      const [, prefix, path, suffix] = importMatch;
      // Skip if already has .js extension or is a .ts extension
      if (!path.endsWith('.js') && !path.endsWith('.ts') && !path.endsWith('.json') && !path.includes('*')) {
        // Check if it's a directory import (ends with /) or file
        // We need to check if the target file exists as a .ts file
        const targetPath = join(file, '..', path);
        // For simplicity, just add .js to all relative imports without extension
        if (!path.endsWith('.js') && !path.endsWith('.ts') && !path.endsWith('.json') && !path.includes('*')) {
          fixed++;
          return `${prefix}${path}.js${suffix}`;
        }
      }
    }
    return line;
  });
  
  if (fixed > 0) {
    writeFileSync(file, newLines.join('\n'), 'utf-8');
    console.log(`Fixed ${fixed} imports in ${relative(ROOT, file)}`);
    totalFixed += fixed;
  }
}

console.log(`Total imports fixed: ${totalFixed}`);
