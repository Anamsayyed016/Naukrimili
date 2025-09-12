import fs from 'fs';

// Read the file
const filePath = 'app/resumes/builder/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix line breaks in JSX attributes
// Pattern 1: Fix line breaks in function calls within JSX attributes
content = content.replace(/onChange=\{\(e\) => ([^}]+)\}/g, (match, funcCall) => {
  // Remove line breaks within the function call
  const cleanedFuncCall = funcCall.replace(/\s*\n\s*/g, ' ');
  return `onChange={(e) => ${cleanedFuncCall}}`;
});

// Pattern 2: Fix line breaks in className attributes
content = content.replace(/className="([^"]*?)"/g, (match, className) => {
  // Remove line breaks within className
  const cleanedClassName = className.replace(/\s*\n\s*/g, ' ');
  return `className="${cleanedClassName}"`;
});

// Pattern 3: Fix line breaks in other string attributes
content = content.replace(/(\w+)="([^"]*?)"/g, (match, attrName, attrValue) => {
  // Skip if it's already a single line
  if (!attrValue.includes('\n')) return match;
  
  // Remove line breaks within attribute values
  const cleanedValue = attrValue.replace(/\s*\n\s*/g, ' ');
  return `${attrName}="${cleanedValue}"`;
});

// Pattern 4: Fix line breaks in JSX text content
content = content.replace(/>\s*\n\s*([^<]+)\s*\n\s*</g, '> $1 <');

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed JSX line breaks in', filePath);
