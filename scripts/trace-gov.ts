import { generateBenchmarkCorpus } from '../lib/resume-parser/custom/benchmark/fixtures/corpus-generator';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { compareSkills } from '../lib/resume-parser/custom/benchmark/compare/skills';
import { compareExperience } from '../lib/resume-parser/custom/benchmark/compare/experience';

const f = generateBenchmarkCorpus(20).find((x) => x.id.includes('government'))!;
const r = runCustomParserPipeline(f.rawText);
console.log(JSON.stringify({
  id: f.id,
  expectedSkills: f.groundTruth.skills,
  actualSkills: r.validation.resume.skills,
  skillsReport: compareSkills(f.groundTruth, r.validation.resume),
  expectedExp: f.groundTruth.experience?.[0],
  actualExp: r.validation.resume.experience?.[0],
  expReport: compareExperience(f.groundTruth, r.validation.resume),
}, null, 2));
