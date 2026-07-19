/* READ-ONLY: print builder formdata summary */
const j = require('../.audit2/' + (process.argv[2] || 'builder-formdata.json'));
const log = console.log;
log('=== personal ===');
log(JSON.stringify(j.personalInfo || {}, null, 1));
log('=== summary ===');
log(j.summary || '(empty)');
const exp = j.experience || [];
log('=== experience ' + exp.length + ' ===');
for (const e of exp)
  log(
    [e.title || e.position, '@', e.company, '|', e.startDate, '-', e.endDate, 'cur:' + e.current, 'desc:' + String(e.description || '').length, 'ach:' + (e.achievements || []).length].join(' ')
  );
const edu = j.education || [];
log('=== education ' + edu.length + ' ===');
for (const e of edu) log([e.degree, '|', e.institution, '|', e.startDate, '-', e.endDate || e.year].join(' '));
const prj = j.projects || [];
log('=== projects ' + prj.length + ' ===');
for (const p of prj) log([p.name || p.title, '| desc:' + String(p.description || '').length, '| tech:' + JSON.stringify(p.technologies || [])].join(' '));
const certs = j.certifications || [];
log('=== certifications ' + certs.length + ' ===');
for (const c of certs) log(typeof c === 'string' ? c : JSON.stringify({ name: c.name, issuer: c.issuer, date: c.date }));
log('=== skills ===');
log(JSON.stringify(j.skills));
log('=== hobbies ===');
log(JSON.stringify(j.hobbies));
log('=== achievements ===');
log(JSON.stringify(j.achievements));
log('=== languages ===');
log(JSON.stringify(j.languages));
