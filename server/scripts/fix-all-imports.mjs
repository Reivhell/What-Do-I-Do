import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative, dirname, resolve, normalize } from 'path';

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

// Build a set of directory paths (relative to ROOT) that have index.ts files
function findIndexDirs(dir) {
  const dirs = new Set();
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const indexPath = join(full, 'index.ts');
      if (existsSync(indexPath)) {
        const relPath = relative(ROOT, full);
        dirs.add(relPath);
      }
      const subDirs = findIndexDirs(full);
      for (const d of subDirs) dirs.add(d);
    }
  }
  return dirs;
}

// Build a set of .ts file paths (relative to ROOT, without extension) for exact matching
function findTsFiles(dir) {
  const files = new Set();
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const subFiles = findTsFiles(full);
      for (const f of subFiles) files.add(f);
    } else if (extname(full) === '.ts' && entry !== 'index.ts') {
      const relPath = relative(ROOT, full).replace(/\.ts$/, '');
      files.add(relPath);
    }
  }
  return files;
}

const indexDirs = findIndexDirs(ROOT);
const tsFiles = findTsFiles(ROOT);

console.log('Directories with index.ts:', [...indexDirs].sort());
console.log('Sample .ts files:', [...tsFiles].slice(0, 10));

const files = walk(ROOT);

let totalFixed = 0;
for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let fixed = 0;
  
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Match import/export statements with relative paths without .js extension
    // Pattern 1: from './path' or from '../path'
    let importMatch = line.match(/^(\s*(?:import|export)\s+(?:.*?\s+)?from\s+['"])(\.[^'"]+)(['"])/);
    // Pattern 2: } from './path' or } from '../path' (without import keyword at start)
    if (!importMatch) {
      importMatch = line.match(/^(\s*\}?\s*from\s+['"])(\.[^'"]+)(['"])/);
    }
    
    if (importMatch) {
      const [, prefix, path, suffix] = importMatch;
      // Skip if already has extension or is a wildcard
      if (!path.endsWith('.js') && !path.endsWith('.ts') && !path.endsWith('.json') && !path.includes('*')) {
        // Resolve the import path relative to the importing file
        const importingDir = dirname(file);
        const resolvedPath = normalize(resolve(importingDir, path));
        const relToRoot = relative(ROOT, resolvedPath);
        
        // Check if it points to a directory with index.ts
        if (indexDirs.has(relToRoot)) {
          fixed++;
          return `${prefix}${path}/index.js${suffix}`;
        }
        
        // Check if it points to a specific .ts file (without extension)
        if (tsFiles.has(relToRoot)) {
          fixed++;
          return `${prefix}${path}.js${suffix}`;
        }
        
        // Default: treat as file import and add .js
        fixed++;
        return `${prefix}${path}.js${suffix}`;
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
