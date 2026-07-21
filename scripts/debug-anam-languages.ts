import { extractLanguagesFromSection } from '../lib/resume-parser/custom/language-extraction';
import { parseLanguageLinesFromLine } from '../lib/resume-parser/custom/language-extraction/parse';

const samples = [
  'English (Fluent) • Hindi (Native)',
  'Languages:\nEnglish (Fluent) • Hindi (Native)',
  'English (Fluent)',
  'Hindi (Native)',
];

for (const s of samples) {
  console.log('---', JSON.stringify(s));
  console.log('lines:', parseLanguageLinesFromLine(s));
  console.log('section:', extractLanguagesFromSection(s));
}
