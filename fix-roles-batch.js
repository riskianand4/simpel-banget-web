#!/usr/bin/env node

// Comprehensive fix for role inconsistencies across the entire codebase
const fs = require('fs');
const path = require('path');

function findFilesRecursively(dir, extension) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        results = results.concat(findFilesRecursively(filePath, extension));
      }
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  }
  
  return results;
}

function fixRoleInconsistencies() {
  const tsFiles = [
    ...findFilesRecursively('src', '.ts'),
    ...findFilesRecursively('src', '.tsx')
  ];
  
  let totalFixed = 0;
  
  for (const file of tsFiles) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      content = content.replace(/(['"])super_admin\1/g, '$1superadmin$1');
      content = content.replace(/super_admin/g, 'superadmin');
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
        totalFixed++;
      }
    } catch (error) {
      console.log(`❌ Error fixing ${file}:`, error.message);
    }
  }
  console.log(`\n🎉 Successfully fixed ${totalFixed} files!`);
}

fixRoleInconsistencies();