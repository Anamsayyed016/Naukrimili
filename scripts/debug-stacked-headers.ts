import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { partitionExperienceBlocks } from '../lib/resume-parser/custom/experience-extraction/boundaries';
import { buildExperienceLines } from '../lib/resume-parser/custom/experience-extraction/lines';
import { buildExperienceFromBlock } from '../lib/resume-parser/custom/experience-extraction/fields';

const section = [
  'Senior Software Engineer',
  'Google',
  'Jan 2020 - Present',
  '- Built scalable systems',
  'Software Developer',
  'Infosys',
  '2018 - 2019',
  '- Developed APIs',
].join('\n');

const exps = extractExperiencesFromSection(section);
console.log('exps', exps);

const lines = buildExperienceLines(section);
const blocks = partitionExperienceBlocks(lines);
blocks.forEach((b, i) => {
  console.log('Block', i, buildExperienceFromBlock(b));
  console.log('header', b.headerText);
  console.log('body', b.bodyLines);
});
