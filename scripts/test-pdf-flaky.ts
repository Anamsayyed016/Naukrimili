import { readFileSync, writeFileSync } from 'fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';

async function main() {
  const buf = readFileSync('C:/Users/admin/Downloads/Trilokinath_Upadhyaya_Resume.pdf');
  for (let i = 0; i < 5; i++) {
    try {
      const r = await parsePdfBuffer(buf);
      console.log(
        `run ${i}: chars=${r.text.length} pages=${r.numpages} stream=${!!r.recoveredFromStreams}`
      );
      writeFileSync(`.audit-trilok/try${i}.txt`, r.text, 'utf8');
    } catch (e) {
      console.log(`run ${i}: ERR`, e instanceof Error ? e.message : e);
    }
  }
}

main();
