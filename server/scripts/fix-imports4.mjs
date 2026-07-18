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
        // Check for specific patterns
        let newPath = path;
        
        // Directory imports that need /index.js
        if (path === '../../drizzle' || path === '../drizzle' || path === '../../../drizzle') {
          newPath = path + '/index.js';
        } else if (path === './common/logger') {
          newPath = path + '/index.js';
        } else if (path === './schema') {
          newPath = path + '/index.js';
        } else if (path.startsWith('./') && path.includes('/') && !path.endsWith('.js')) {
          // Imports like ./dto/money.dto -> ./dto/money.dto.js
          newPath = path + '.js';
        } else if (path.startsWith('../') && path.includes('/', 3) && !path.endsWith('.js')) {
          // Imports like ../dto/task.dto -> ../dto/task.dto.js
          newPath = path + '.js';
        } else if (path.startsWith('./') && !path.includes('/') && !path.endsWith('.js')) {
          // Imports like ./tasks.service -> ./tasks.service.js
          newPath = path + '.js';
        } else if (path.startsWith('../') && !path.includes('/', 3) && !path.endsWith('.js')) {
          // Imports like ../tasks.service -> ../tasks.service.js
          newPath = path + '.js';
        } else {
          // Default: add .js
          newPath = path + '.js';
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
