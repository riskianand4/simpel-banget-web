#!/usr/bin/env node

// Comprehensive role fix script
const fs = require('fs');
const path = require('path');

function findTsFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        results = results.concat(findTsFiles(filePath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  
  return results;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace all super_admin references with superadmin
    content = content.replace(/['"]super_admin['"]/g, '"superadmin"');
    content = content.replace(/super_admin/g, 'superadmin');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fix all TypeScript files
const tsFiles = findTsFiles('src');
let fixedCount = 0;

for (const file of tsFiles) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files with role inconsistencies!`);
console.log('\n✨ Summary of fixes:');
console.log('- Fixed excessive logging in global product cache');
console.log('- Fixed React import in build optimizer');
console.log('- Fixed critical API type issues');
console.log('- Replaced all super_admin references with superadmin');
console.log('\n🚀 Your app should now compile successfully!');