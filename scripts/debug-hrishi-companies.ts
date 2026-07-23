import {
  detectCompanyFromLine,
  looksLikeSentenceNotCompany,
  looksLikeInstitutionalEmployer,
} from '../lib/resume-parser/custom/experience-extraction/company';
import {
  looksLikeCompanyNameLine,
  isPlausibleExperienceCompany,
} from '../lib/resume-parser/import-sanitize';

const lines = [
  'Group Company of KJS Cement (I) Ltd.',
  'FMCG Sector Company',
  'Listed Infrastructure Conglomerate',
  'Various Clients (Consultancy Practice) – Bhopal, M.P.',
  'Velnik India Pvt. Ltd. – Indore, M.P.',
  'Dilip Buildcon Limited – Bhopal, M.P.',
  'Career Achievements',
];
for (const t of lines) {
  const det = detectCompanyFromLine(t);
  console.log(
    JSON.stringify({
      t,
      detect: det,
      plausible: isPlausibleExperienceCompany(det.company || t),
      looks: looksLikeCompanyNameLine(t),
      institutional: looksLikeInstitutionalEmployer(t),
      prose: looksLikeSentenceNotCompany(t),
    })
  );
}
