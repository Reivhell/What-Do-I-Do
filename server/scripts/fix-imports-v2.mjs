import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative, dirname } from 'path';

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

// Build a map of directory paths that have index.ts files
function findIndexDirs(dir, base = '') {
  const dirs = new Set();
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Check if this directory has an index.ts
      if (existsSync(join(full, 'index.ts'))) {
        const relPath = base ? join(base, entry) : entry;
        dirs.add(relPath);
      }
      const subDirs = findIndexDirs(full, base ? join(base, entry) : entry);
      for (const d of subDirs) dirs.add(d);
    }
  }
  return dirs;
}

const indexDirs = findIndexDirs(ROOT);
console.log('Directories with index.ts:', [...indexDirs].sort());

const files = walk(ROOT);

let totalFixed = 0;
for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let fixed = 0;
  
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Match import/export statements with relative paths without .js extension
    const importMatch = line.match(/^(\s*(?:import|export)\s+(?:.*?\s+)?from\s+['"])(\.[^'"]+)(['"])/);
    if (importMatch) {
      const [, prefix, path, suffix] = importMatch;
      // Skip if already has extension or is a wildcard
      if (!path.endsWith('.js') && !path.endsWith('.ts') && !path.endsWith('.json') && !path.includes('*')) {
        // Check if this path points to a directory with index.ts
        const importDir = relative(dirname(file), join(ROOT, path)).replace(/^\.\//, '');
        const importDirParts = importDir.split('/');
        let isIndexDir = false;
        let checkPath = '';
        
        // Check progressively longer paths
        for (const part of importDirParts) {
          checkPath = checkPath ? join(checkPath, part) : part;
          if (indexDirs.has(checkPath)) {
            isIndexDir = true;
            break;
          }
        }
        
        // Also check the exact path
        if (!isIndexDir && indexDirs.has(importDir)) {
          isIndexDir = true;
        }
        
        if (isIndexDir) {
          fixed++;
          return `${prefix}${path}/index.js${suffix}`;
        } else {
          // Regular file import - add .js
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
