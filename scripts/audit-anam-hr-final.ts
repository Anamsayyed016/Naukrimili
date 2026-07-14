import { readFileSync } from "fs";
import { parsePdfBuffer } from "../lib/pdf-parse-safe";
import { prepareResumeTextForParsing } from "../lib/resume-parser/resume-document-analysis";
import { runCustomParserPipeline } from "../lib/resume-parser/custom/reliability/pipeline";
import { mapExtractedToUploadProfile } from "../lib/resume-parser/map-to-upload-profile";
import { normalizeUploadProfile } from "../lib/resume-parser/normalize-extracted";
import { validateAndRepairResumeExtraction } from "../lib/resume-parser/extraction-repair";
import { transformImportDataToBuilder } from "../lib/resume-builder/import-transformer";
import { mapBuilderFormDataToCanonical } from "../lib/resume-builder/canonical-mapping/map-to-builder";

async function main() {
  const { text: raw } = await parsePdfBuffer(Buffer.from(readFileSync("C:/Users/admin/Downloads/Anam_Sayyed_HR_Resume.pdf")));
  const prep = prepareResumeTextForParsing(raw);
  const pipeline = runCustomParserPipeline(prep.text);
  const upload = normalizeUploadProfile(mapExtractedToUploadProfile(pipeline.validation.resume, { aiProvider: "custom-parser" }) as any) as any;
  const { data: repaired } = validateAndRepairResumeExtraction({ ...upload, rawText: prep.text, _imported: true, customParserUsed: true });
  const builder = transformImportDataToBuilder({ ...repaired, rawText: prep.text, _imported: true, customParserUsed: true }) as any;
  console.log({
    name: `${builder.firstName} ${builder.lastName}`,
    fullName: builder.fullName,
    location: builder.location || builder.city,
    exp: (builder.experience||[]).map((e:any)=>({t:e.title,c:e.company,s:e.startDate,e:e.endDate})),
    edu: (builder.education||[]).map((e:any)=>({d:e.degree,i:e.institution})),
    skills: (builder.skills||[]).slice(0,12),
    langs: builder.languages,
    summaryLen: String(builder.summary||"").length,
    certs: builder.certifications,
  });
}
main();
