const fs = require('fs');

// Read the file
let content = fs.readFileSync('components/UnifiedJobSearch.tsx', 'utf8');

// Fix the useSearchParams call
content = content.replace(
  'const searchParams = useSearchParams();',
  'const searchParams = isMounted ? useSearchParams() : null;'
);

// Fix the useEffect for URL params
content = content.replace(
  'useEffect(() => {\n    const query = searchParams.get',
  'useEffect(() => {\n    if (!isMounted || !searchParams) return;\n    const query = searchParams.get'
);

// Write back
fs.writeFileSync('components/UnifiedJobSearch.tsx', content);
console.log('Fixed hydration issues');
