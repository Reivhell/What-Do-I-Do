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
  
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Match import/export statements with relative paths
    const importMatch = line.match(/^(\s*(?:import|export)\s+(?:.*?\s+)?from\s+['"])(\.[^'"]+)(['"])/);
    if (importMatch) {
      const [, prefix, path, suffix] = importMatch;
      // Skip if already has proper extension
      if (!path.endsWith('.js') && !path.endsWith('.ts') && !path.endsWith('.json') && !path.includes('*')) {
        // Check for specific directory imports that need /index.js
        let newPath = path;
        if (path.endsWith('/drizzle') || path === '../../drizzle' || path === '../drizzle' || path === '../../../drizzle') {
          newPath = path + '/index.js';
        } else if (path.endsWith('/logger') || path === './common/logger') {
          newPath = path + '/index.js';
        } else if (path.endsWith('/schema') || path === './schema') {
          newPath = path + '/index.js';
        } else {
          // Regular file import - add .js
          newPath = path + '.js';
        }
        fixed++;
        return `${prefix}${newPath}${suffix}`;
      }
      // Also fix cases where it has .js but points to a directory
      if (path.endsWith('.js') && (path.includes('/drizzle.js') || path.includes('/logger.js') || path.includes('/schema.js'))) {
        // But we need to check if it's a directory - replace drizzle.js with drizzle/index.js
        let newPath = path;
        if (path.includes('/drizzle.js')) {
          newPath = path.replace('/drizzle.js', '/drizzle/index.js');
        } else if (path.includes('/logger.js')) {
          newPath = path.replace('/logger.js', '/logger/index.js');
        } else if (path.includes('/schema.js')) {
          newPath = path.replace('/schema.js', '/schema/index.js');
        }
        if (newPath !== path) {
          fixed++;
          return `${prefix}${newPath}${suffix}`;
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
