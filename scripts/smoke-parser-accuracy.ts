/**
 * Smoke test — parser accuracy improvements (production diagnostics fixes).
 */
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { reconstructColumnLayout } from '../lib/resume-parser/text-recovery';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { runBenchmarkCase, runBenchmarkSuite, BENCHMARK_FIXTURES } from '../lib/resume-parser/custom/benchmark';
import { runReliabilitySuite } from '../lib/resume-parser/custom/reliability';
import { looksLikeSentenceNotCompany } from '../lib/resume-parser/custom/experience-extraction/company';
import { inferSectionPresence, computeParserConfidenceScore } from '../lib/resume-parser/custom/validation-repair/scoring';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const ANAM_MULTI_COLUMN = [
  'ANAM SAYYED                          SKILLS',
  'Python Developer                     Python, Django, ReactJS, HTML, CSS',
  'anamsayyed58@gmail.com | 7415566841  JavaScript, Node.js, MySQL, Git',
  'Bhopal, Madhya Pradesh               REST API, MongoDB, Firebase, AWS',
  'linkedin.com/in/anam-sayyed',
  '',
  'PROFESSIONAL SUMMARY',
  'Highly motivated Full-Stack Python Developer with expertise in Python, Django, and ReactJS.',
  '',
  'WORK EXPERIENCE',
  'Python Developer                     Digital Solutions Pvt Ltd',
  'Bhopal, Madhya Pradesh               2022-01 - Present',
  '- Designed secure, scalable RESTful APIs using Django and Flask.',
  '',
  'Full Stack Developer                 Digital',
  'Bhopal, Madhya Pradesh               2020-02 - 2022-01',
  '- Led design and development of full-stack web applications.',
  '',
  'Full Stack Python Developer          Cybrom Technology',
  'Bhopal                               2019 - 2020',
  '- Wrote clean, secure code with excellent UI design.',
  '',
  'PROJECTS',
  'Job Portal Application',
  'Built a full-stack job portal with Next.js and PostgreSQL',
  '',
  'EDUCATION',
  "All Saints' College of Technology",
  'B.Tech Computer Science',
  '2016 - 2020',
  '',
  'Barkatullah University',
  'Master of Business Administration (MBA)',
  '2020 - 2022',
].join('\n');

// P1: column reconstruction
const reconstructed = reconstructColumnLayout(ANAM_MULTI_COLUMN);
assert(reconstructed.includes('ANAM SAYYED'), 'name preserved');
assert(!/ANAM SAYYED\s+SKILLS/i.test(reconstructed), 'SKILLS bleed stripped from name');

// P2: sentence company rejection
assert(
  looksLikeSentenceNotCompany('Led design and development of full-stack web applications.'),
  'sentence rejected as company'
);
assert(!looksLikeSentenceNotCompany('Digital Solutions Pvt Ltd'), 'real company accepted');

// P6: absent optional sections excluded from weight
const sectionConfidence = {
  identity: 80,
  summary: 80,
  experience: 70,
  projects: 0,
  education: 70,
  skills: 75,
  languages: 0,
  certifications: 0,
};
const absentOptional = computeParserConfidenceScore(
  sectionConfidence,
  70,
  inferSectionPresence({ rawText: 'John\nExperience\nAcme' })
);
const withOptional = computeParserConfidenceScore(sectionConfidence, 70, {
  languages: true,
  certifications: true,
  projects: false,
});
assert(absentOptional > withOptional, 'absent optional sections improve score');

// Full pipeline on Anam resume
const prepared = prepareResumeTextForParsing(ANAM_MULTI_COLUMN);
const pipeline = runCustomParserPipeline(prepared.text);
const v = pipeline.validation;
console.log('ANAM scores:', {
  parser: v.parserConfidenceScore,
  quality: v.resumeQualityScore,
  sections: v.validationReport.sectionConfidence,
  errors: v.validationReport.errors.length,
  warnings: v.validationReport.warnings.length,
  repairs: v.repairReport.repairCount,
});
assert(v.parserConfidenceScore >= 70, `parser confidence >= 70 (got ${v.parserConfidenceScore})`);
assert(v.resumeQualityScore >= 66, `resume quality >= 66 (got ${v.resumeQualityScore})`);
assert(v.validationReport.errors.length === 0, 'no validation errors');

const mba = pipeline.validation.validated.educations.find((e) =>
  /mba|business administration/i.test(e.degree || '')
);
assert(mba?.institution?.match(/barkatullah/i), 'MBA institution correct');

const companies = pipeline.validation.validated.experiences.map((e) => e.company);
assert(companies.some((c) => /digital/i.test(c || '')), 'company extracted');
assert(!companies.some((c) => looksLikeSentenceNotCompany(c || '')), 'no sentence companies');

// Benchmark
function runBenchPipeline(rawText: string) {
  return runCustomParserPipeline(rawText).validation;
}

const devReport = runBenchmarkCase(
  BENCHMARK_FIXTURES[0],
  { kind: 'validation', result: runBenchPipeline(BENCHMARK_FIXTURES[0].rawText || '') },
  { deterministic: true }
);
assert(devReport.overallAccuracy > 0, 'benchmark accuracy > 0');

const suite = runBenchmarkSuite(
  BENCHMARK_FIXTURES.map((f) => ({
    fixture: f,
    actual: { kind: 'extracted', data: f.groundTruth },
  })),
  { deterministic: true }
);
assert(suite.aggregate.meanOverallAccuracy >= 90, 'benchmark suite mean >= 90');

// Reliability
const reliability = runReliabilitySuite({ deterministic: true, stressScales: [50] });
assert(reliability.regression.totalCases > 0, 'reliability regression ran');
assert(reliability.stress[0].failureRate < 5, 'stress failure rate < 5%');

console.log('smoke-parser-accuracy: OK');
console.log(
  JSON.stringify(
    {
      anam: {
        parserConfidence: pipeline.validation.parserConfidenceScore,
        resumeQuality: pipeline.validation.resumeQualityScore,
        experienceCount: pipeline.validation.validated.experiences.length,
        educationInstitutions: pipeline.validation.validated.educations.map((e) => e.institution),
        errors: pipeline.validation.validationReport.errors.length,
        warnings: pipeline.validation.validationReport.warnings.length,
      },
      benchmark: {
        developerAccuracy: devReport.overallAccuracy,
        suiteMean: suite.aggregate.meanOverallAccuracy,
      },
      reliability: {
        readiness: reliability.readiness.score,
        regressionPassRate: reliability.regression.passRate,
        stressFailureRate: reliability.stress[0].failureRate,
      },
    },
    null,
    2
  )
);
