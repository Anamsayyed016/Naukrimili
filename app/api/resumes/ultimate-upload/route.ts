import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { uploadResume } from '@/lib/storage/resume-storage';
import { HybridResumeAI, type HybridResumeData } from '@/lib/hybrid-resume-ai';
import { EnhancedResumeAI, type ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { AffindaResumeParser } from '@/lib/affinda-resume-parser';
import { GoogleCloudOCRService } from '@/lib/services/google-cloud-ocr';
import { isAffindaEnabled } from '@/lib/resume-parser/affinda-config';
import { isApilayerEnabled } from '@/lib/resume-parser/apilayer-config';
import { getResumeParserHealth } from '@/lib/resume-parser/parser-health';
import {
  mapExtractedToUploadProfile,
  hasMinimalAutofillPayload,
  isAffindaPrimaryAcceptable,
  isSuspectSummary,
  isUsableExtraction,
  shouldPreferHybridOverAffinda,
} from '@/lib/resume-parser/map-to-upload-profile';
import {
  mergeTextRecoveryIntoExtracted,
  resolveDocumentParserAutofill,
} from '@/lib/resume-parser/merge-resume-data';
import {
  normalizeUploadProfile,
  cleanMultiline,
} from '@/lib/resume-parser/normalize-extracted';
import {
  deriveDisplayNameFromEmail,
  isPlausiblePersonName,
  isValidatedContactName,
  isExperienceBlurbFragment,
  pickBestNameFromCandidates,
  splitMergedProjectEntries,
  logRawProjects,
  isPlausibleCertificationEntry,
} from '@/lib/resume-parser/import-sanitize';
import {
  applyRecoveredWordingToProfile,
  experienceSectionMatch,
  educationSectionMatch,
  findBestRecoveredMatchIndex,
  experienceMatchScore,
  educationMatchScore,
  preferRecoveredWording,
  preferRecoveredStringList,
} from '@/lib/resume-parser/prefer-recovered-wording';
import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';
import {
  logFullUploadProvenance,
  logProfileFormDataAudit,
  logUploadPipelineTrace,
  UploadPipelineTiming,
  ParserTimeBudget,
  getUploadParserBudgetMs,
  uploadStageDebug,
} from '@/lib/resume-parser/upload-pipeline-trace';
import {
  beginImportFieldTrace,
  flushImportFieldTraceReport,
  isImportFieldTraceEnabled,
  traceImportStageOutput,
} from '@/lib/resume-parser/import-field-trace';
import { collectNameCandidatesFromText, classifyResumeTextSignals } from '@/lib/resume-parser/text-recovery';
import {
  orchestrateResumeParse,
  getOrchestratorConfig,
  isCustomParserActive,
  logOrchestratorMetrics,
} from '@/lib/resume-parser/custom/integration';

// Configure route for larger file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Large/image-rich PDFs: Affinda (55s) + Eden (55s) + OCR can exceed 60s — align with nginx /api/ 300s cap
export const maxDuration = 180;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
/** Full-PDF Vision OCR above this size spikes memory and often times out; document parsers handle large files. */
const OCR_MAX_FILE_BYTES = 3 * 1024 * 1024;
/** Minimum remaining budget (ms) before starting Hybrid / Enhanced AI extraction. */
const AI_PARSER_MIN_BUDGET_MS = 12_000;

/** Temporary pipeline diagnostics — grep pm2 logs for [UPLOAD-DIAG]. Remove when stable. */
function uploadDiag(
  reqId: string,
  layer: string,
  data?: Record<string, unknown>
): void {
  const payload = {
    layer,
    ts: new Date().toISOString(),
    ...data,
  };
  console.log(`[UPLOAD-DIAG][${reqId}] ${layer}`, payload);
}

function parseContentLength(request: NextRequest): number | null {
  const raw = request.headers.get('content-length');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/** Job.skills may be JSON array or comma-separated text (e.g. "Python, Go"). */
function parseJobSkillsField(skills: unknown): string[] {
  if (Array.isArray(skills)) {
    return skills.map((s) => String(s ?? '').trim()).filter(Boolean);
  }
  if (typeof skills !== 'string') return [];
  const trimmed = skills.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s ?? '').trim()).filter(Boolean);
      }
    } catch {
      // fall through to comma split
    }
  }
  return trimmed
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * POST /api/resumes/ultimate-upload
 * Enhanced resume upload with AI parsing and job recommendations
 */
export async function POST(request: NextRequest) {
  const REQ = `RZ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  beginImportFieldTrace(REQ);
  const log = (msg: string, data?: unknown) => {
    if (data !== undefined) console.log(`[${REQ}] ${msg}`, data);
    else console.log(`[${REQ}] ${msg}`);
  };
  const warn = (msg: string, data?: unknown) => {
    if (data !== undefined) console.warn(`[${REQ}] ${msg}`, data);
    else console.warn(`[${REQ}] ${msg}`);
  };

  const contentLength = parseContentLength(request);
  uploadDiag(REQ, 'L4-next-route-enter', {
    path: '/api/resumes/ultimate-upload',
    method: 'POST',
    contentLength,
    contentLengthMb: contentLength != null ? (contentLength / (1024 * 1024)).toFixed(3) : null,
    contentType: request.headers.get('content-type'),
    maxAppBytes: MAX_FILE_SIZE,
    note: 'If browser shows 413 and this log never appears, reject layer is nginx/proxy (default client_max_body_size 1m)',
  });

  try {
    const pipelineStartMs = Date.now();
    const uploadTiming = new UploadPipelineTiming();
    const parserBudget = new ParserTimeBudget(getUploadParserBudgetMs());
    log('upload timeout chain', {
      nextMaxDurationSec: maxDuration,
      clientAbortSec: 180,
      parserBudgetMs: parserBudget.budgetMs,
      affindaTimeoutMs: parseInt(process.env.AFFINDA_TIMEOUT_MS || '55000', 10),
      edenTimeoutMs: parseInt(process.env.EDEN_AI_TIMEOUT_MS || '55000', 10),
      apilayerTimeoutMs: parseInt(process.env.APILAYER_TIMEOUT_MS || '45000', 10),
      note: 'HTTP 504 is emitted by nginx/proxy when proxy_read_timeout is exceeded before this route returns',
    });

    log('parser environment', {
      affinda: isAffindaEnabled(),
      eden: !!process.env.EDEN_AI_API_KEY,
      apilayer: isApilayerEnabled(),
      parsers: getResumeParserHealth().map((p) => ({ id: p.id, enabled: p.enabled })),
      openai: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'),
      gemini: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIzaSy'),
    });

    const session = await auth();
    
    if (!session || !session.user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required. Please log in to upload your resume.' 
      }, { status: 401 });
    }

    console.log('👤 Authenticated user:', session.user.email);
    uploadDiag(REQ, 'L4-next-auth-ok', { user: session.user.email });

    const formData = await request.formData();
    uploadDiag(REQ, 'L4-next-formdata-ok', {
      contentLength,
      note: 'Request body parsed by Next.js — nginx/proxy already accepted the upload',
    });
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ No file provided');
      uploadDiag(REQ, 'L5-app-no-file', { rejectLayer: 'application' });
      return NextResponse.json({ 
        success: false,
        error: 'No file provided' 
      }, { status: 400 });
    }

    uploadDiag(REQ, 'L5-app-file-received', {
      fileName: file.name,
      fileType: file.type,
      fileSizeBytes: file.size,
      fileSizeMb: (file.size / (1024 * 1024)).toFixed(3),
      contentLength,
    });
    uploadStageDebug(REQ, 'UPLOAD', 'file received', {
      fileName: file.name,
      fileSizeBytes: file.size,
      fileType: file.type,
    });

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      console.log('❌ File too large:', file.size, 'bytes (max:', MAX_FILE_SIZE, ')');
      uploadDiag(REQ, 'L5-app-size-reject', {
        rejectLayer: 'application',
        fileSizeBytes: file.size,
        maxBytes: MAX_FILE_SIZE,
      });
      return NextResponse.json({ 
        success: false, 
        error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
        rejectLayer: 'application',
      }, {
        status: 413,
        headers: { 'X-Upload-Reject-Layer': 'application' },
      });
    }

    uploadDiag(REQ, 'L5-app-size-pass', {
      fileSizeBytes: file.size,
      maxBytes: MAX_FILE_SIZE,
    });

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.' 
      }, { status: 400 });
    }

    console.log('✅ File validation passed:', { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    });

    // Convert file to buffer
    console.log('📦 Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);
    console.log('✅ File converted to buffer, size:', fileBuffer.length, 'bytes');
    uploadDiag(REQ, 'L6-storage-start', { bufferBytes: fileBuffer.length });

    // Upload file using the unified storage service (GCS or local)
    console.log('💾 Uploading file using storage service...');
    const uploadResult = await uploadResume(
      fileBuffer,
      file.name,
      file.type,
      file.size,
      session.user.email || undefined
    );

    if (!uploadResult.success) {
      console.log('❌ File upload failed:', uploadResult.error);
      return NextResponse.json({ 
        success: false, 
        error: uploadResult.error || 'Failed to upload file'
      }, { status: 500 });
    }

    console.log(`✅ File uploaded successfully via ${uploadResult.storage.toUpperCase()}:`, uploadResult.fileUrl);
    
    const timestamp = Date.now();
    const filename = uploadResult.fileName;

    // Extract text from file with enhanced PDF parsing
    uploadDiag(REQ, 'L7-parser-start', {
      fileName: file.name,
      fileSizeBytes: file.size,
      storage: uploadResult.storage,
    });
    console.log('📄 Starting text extraction from file...');
    console.log('   - File type:', file.type);
    console.log('   - File size:', file.size, 'bytes');
    console.log('   - File name:', file.name);
    
    let extractedText: string;
    let ocrApplied = false;
    const textExtractionStart = Date.now();
    uploadStageDebug(REQ, 'PDF', 'extraction started', { fileSizeBytes: file.size });
    try {
      extractedText = await extractTextFromFile(file, bytes);
      
      // ENHANCED: More intelligent detection of binary/image-based PDFs
      // Check for PDF binary markers ONLY at the start (not in content)
      const startsWithPDFHeader = extractedText.startsWith('%PDF');
      const hasPDFStructureOnly = extractedText.includes('endobj') && extractedText.includes('/Type/Page');
      
      // Count readable text more accurately
      const readableWords = extractedText.match(/[a-zA-Z]{3,}/g) || [];
      const hasReadableText = readableWords.length > 20; // Increased threshold from 10 to 20
      const textDensity = readableWords.length / Math.max(extractedText.length, 1); // Words per character
      
      // CRITICAL FIX: Only flag as binary if BOTH conditions are met:
      // 1. Has PDF structure markers (endobj, /Type/Page)
      // 2. Very low text density (< 0.001) OR almost no readable words (< 15)
      const hasVeryLowDensity = textDensity < 0.001;
      const hasAlmostNoWords = readableWords.length < 15;
      const layoutSignals = classifyResumeTextSignals(extractedText);
      const isPDFBinary = startsWithPDFHeader && hasPDFStructureOnly && hasVeryLowDensity && hasAlmostNoWords;
      const shouldAttemptOcr =
        isPDFBinary ||
        (layoutSignals.scannedLikely && (hasVeryLowDensity || readableWords.length < 40)) ||
        (startsWithPDFHeader &&
          hasPDFStructureOnly &&
          readableWords.length < 50 &&
          textDensity < 0.0025);
      
      console.log('📊 PDF Analysis:', {
        startsWithHeader: startsWithPDFHeader,
        hasStructure: hasPDFStructureOnly,
        wordCount: readableWords.length,
        textLength: extractedText.length,
        textDensity: textDensity.toFixed(4),
        hasVeryLowDensity: hasVeryLowDensity,
        hasAlmostNoWords: hasAlmostNoWords,
        isProbablyBinary: isPDFBinary,
        scannedLikely: layoutSignals.scannedLikely,
        shouldAttemptOcr,
      });
      
      if (shouldAttemptOcr) {
        if (fileBuffer.length > OCR_MAX_FILE_BYTES) {
          warn('[OCR] skipped: file_too_large', {
            reason: 'file_too_large',
            fileSizeBytes: fileBuffer.length,
            limitBytes: OCR_MAX_FILE_BYTES,
            note: 'Relying on Affinda/document parsers for this upload',
          });
        } else {
        const ocrStart = Date.now();
        uploadStageDebug(REQ, 'OCR', 'started', { fileSizeBytes: fileBuffer.length });
        console.warn('⚠️ Low-quality PDF text — attempting OCR recovery...');
        console.log('   - Text starts with:', extractedText.substring(0, 100));
        
        // Try OCR extraction for image-based PDFs
        const ocrService = new GoogleCloudOCRService();
        
        if (ocrService.isAvailable()) {
          try {
            console.log('🔍 Attempting Google Cloud Vision OCR extraction...');
            
            // Convert PDF buffer to base64 for OCR
            const pdfBase64 = fileBuffer.toString('base64');
            const base64WithPrefix = `data:application/pdf;base64,${pdfBase64}`;
            
            const ocrResult = await ocrService.extractTextFromImage(base64WithPrefix);
            
            if (ocrResult && ocrResult.text && ocrResult.text.length > 100) {
              console.log('✅ OCR extraction successful!');
              console.log('   - OCR text length:', ocrResult.text.length);
              console.log('   - OCR confidence:', (ocrResult.confidence * 100).toFixed(1) + '%');
              console.log('   - Detected languages:', ocrResult.detectedLanguages.join(', ') || 'none');
              console.log('   - Text preview:', ocrResult.text.substring(0, 300));
              
              extractedText = ocrResult.text;
              ocrApplied = true;
            } else {
              warn('[OCR] skipped: insufficient_text_returned', {
                reason: 'insufficient_text_returned',
                returnedLength: ocrResult?.text?.length ?? 0,
                minimumRequired: 100,
              });
            }
          } catch (ocrError) {
            warn('[OCR] failed', {
              reason: 'ocr_request_failed',
              message: ocrError instanceof Error ? ocrError.message : String(ocrError),
            });
          }
        } else {
          warn('[OCR] skipped: ocr_disabled', {
            reason: 'missing_api_key',
            note: 'OCR is disabled without a Google Cloud Vision API key',
            hint: 'Set GOOGLE_CLOUD_OCR_API_KEY, GOOGLE_CLOUD_API_KEY, or GOOGLE_VISION_API_KEY',
          });
        }
        uploadTiming.record('ocrMs', Date.now() - ocrStart);
        uploadStageDebug(REQ, 'OCR', 'completed', {
          durationMs: Date.now() - ocrStart,
          applied: ocrApplied,
        });
        }
      } else if (file.type === 'application/pdf' && layoutSignals.scannedLikely) {
        warn('[OCR] skipped: ocr_disabled', {
          reason: 'ocr_gate_not_met',
          note: 'Scanned PDF signals detected but OCR gate thresholds were not met',
          wordCount: readableWords.length,
          textDensity: textDensity.toFixed(4),
        });
      }
      
      console.log('✅ Text extraction successful!');
      console.log('   - Text length:', extractedText.length, 'characters');
      console.log('   - Text preview (first 500 chars):');
      console.log(extractedText.substring(0, 500));
      console.log('   - Text contains "experience"?', extractedText.toLowerCase().includes('experience'));
      console.log('   - Text contains "education"?', extractedText.toLowerCase().includes('education'));
      console.log('   - Text contains "skills"?', extractedText.toLowerCase().includes('skills'));
      console.log('   - Number of words:', extractedText.split(/\s+/).length);
      console.log('   - Number of lines:', extractedText.split('\n').length);
      
      // CRITICAL: Final validation - but NEVER reject upload, only warn
      const finalWordCount = (extractedText.match(/[a-zA-Z]{3,}/g) || []).length;
      const hasPDFHeader = extractedText.substring(0, 5) === '%PDF-';
      const hasMinimumContent = extractedText.length >= 50 && finalWordCount >= 5; // Reduced from 10 to 5
      
      if (!hasMinimumContent) {
        console.warn('⚠️ WARNING: Extracted text is minimal');
        console.warn('   - Length:', extractedText.length, 'characters');
        console.warn('   - Word count:', finalWordCount, 'words');
        console.warn('   - Starts with:', extractedText.substring(0, 50));
        console.warn('   → Proceeding anyway to allow manual profile completion');
        
        // Add helpful note but DON'T block upload
        if (!extractedText.includes('[Note:')) {
          extractedText += '\n\n[Note: Limited text extracted from PDF. Please verify and complete your profile manually.]';
        }
      }
    } catch (extractError) {
      const errorMessage = extractError instanceof Error ? extractError.message : 'Unknown error';
      console.error('❌ Text extraction encountered error:', errorMessage);
      console.error('   - Full error:', extractError);
      console.warn('   → Allowing upload to proceed with manual profile entry');
      
      // CRITICAL: DON'T return error response - set minimal extracted text and continue
      // This allows the upload to succeed even if text extraction fails
      extractedText = `Resume: ${file.name}\n\n[Automatic text extraction was not possible. Please complete your profile manually.]`;
      
      console.log('✅ Continuing with fallback text to allow upload');
    }

    uploadTiming.record('textExtractionMs', Date.now() - textExtractionStart);
    uploadStageDebug(REQ, 'PDF', 'extraction completed', {
      durationMs: Date.now() - textExtractionStart,
      textLength: extractedText?.length ?? 0,
      ocrApplied,
    });

    const rawPdfText = extractedText;

    // Classify layout (ATS / executive / sidebar / cover letter) and normalize text
    // before Affinda / Eden / Hybrid parsers run.
    let resumeDocumentProfile: ReturnType<typeof prepareResumeTextForParsing>['profile'] | null =
      null;
    let hybridSkippedReason = '';
    if (extractedText.length > 80) {
      const prepared = prepareResumeTextForParsing(extractedText);
      resumeDocumentProfile = prepared.profile;
      if (prepared.text.length >= 50) {
        log('Resume document prepared for parsing', {
          types: prepared.profile.types,
          primaryType: prepared.profile.primaryType,
          signals: prepared.profile.signals,
          before: extractedText.length,
          after: prepared.text.length,
        });
        extractedText = prepared.text;
      }
    }

    // Parse resume data using REAL AI (Hybrid approach for best accuracy)
    console.log('🤖 Starting REAL AI resume analysis with HybridResumeAI...');
    console.log('🔑 OpenAI available:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 Gemini available:', !!process.env.GEMINI_API_KEY);
    console.log('📄 Extracted text for AI:', {
      length: extractedText.length,
      preview: extractedText.substring(0, 300),
      wordCount: (extractedText.match(/[a-zA-Z]{3,}/g) || []).length
    });
    
    let parsedData: any;
    let aiSuccess = false;
    let aiProvider = 'fallback';
    let provenanceAffinda: ExtractedResumeData | null = null;
    let provenanceEden: ExtractedResumeData | null = null;
    let customParserUsed = false;
    
    // CRITICAL: Skip AI ONLY if extracted text is truly minimal
    const isPdfParseFailure =
      extractedText.includes('[PDF parsing failed') ||
      extractedText.includes('[This PDF appears to contain no extractable text]');
    const isJustFallbackText =
      (extractedText.includes('[Automatic text extraction was not possible]') ||
        extractedText.includes('[Note: Limited text extracted') ||
        isPdfParseFailure) &&
      extractedText.length < 200;

    const orchestratorConfig = getOrchestratorConfig();
    if (!isJustFallbackText && isCustomParserActive(orchestratorConfig)) {
      try {
        const orchResult = await orchestrateResumeParse(
          {
            normalizedText: extractedText,
            fileBuffer,
            fileName: file.name,
            documentProfile: resumeDocumentProfile,
            resumeIdentifier: REQ,
          },
          { deferProductionFallback: true }
        );
        logOrchestratorMetrics(orchResult.metrics, orchResult.fallbackReason, REQ);

        if (
          orchResult.selectedParser === 'custom' &&
          orchResult.data &&
          !orchResult.deferToProductionParser
        ) {
          if (isImportFieldTraceEnabled()) {
            traceImportStageOutput('custom_parser_output', orchResult.data, 'custom-parser');
          }
          parsedData = mapExtractedToUploadProfile(orchResult.data, {
            aiProvider: 'custom-parser',
          });
          aiSuccess = true;
          aiProvider = 'custom-parser';
          customParserUsed = true;
          uploadStageDebug(REQ, 'CUSTOM-PARSER', 'primary accepted', {
            confidence: orchResult.metrics.primary.confidence,
            resumeQuality: orchResult.metrics.primary.resumeQuality,
            sectionScores: orchResult.metrics.primary.sectionScores,
          });
        } else if (orchResult.deferToProductionParser) {
          uploadStageDebug(REQ, 'CUSTOM-PARSER', 'deferred to production parser', {
            reason: orchResult.fallbackReason,
            mode: orchestratorConfig.mode,
          });
        }
      } catch (orchError) {
        uploadStageDebug(REQ, 'CUSTOM-PARSER', 'orchestrator error — production fallback', {
          message: orchError instanceof Error ? orchError.message : String(orchError),
        });
      }
    }

    if (customParserUsed) {
      uploadStageDebug(REQ, 'CUSTOM-PARSER', 'skipping legacy parser chain');
    } else if (isJustFallbackText && !isAffindaEnabled()) {
      console.warn('⚠️ Extracted text is minimal fallback - skipping AI, using basic extraction');
      parsedData = await parseResumeBasic(extractedText, session);
      aiProvider = 'basic-fallback';
    } else {
      let usedAffindaPrimary = false;
      let usedDocumentParser = false;
      let lastAffindaResult: ExtractedResumeData | null = null;
      let documentAutofillAttempted = false;
      let documentAutofillCache: Awaited<
        ReturnType<typeof resolveDocumentParserAutofill>
      > | undefined;

      const applyDocAutofill = (
        docAutofill: NonNullable<Awaited<ReturnType<typeof resolveDocumentParserAutofill>>>
      ): void => {
        provenanceAffinda = docAutofill.affindaData;
        provenanceEden = docAutofill.edenData || null;
        parsedData = mapExtractedToUploadProfile(docAutofill.data, {
          aiProvider: docAutofill.provider,
        });
        aiSuccess = true;
        aiProvider = docAutofill.provider;
        usedDocumentParser = true;
      };

      /** Runs Eden/Apilayer/text-recovery once per request — retries reuse cache or text-only recovery. */
      const runDocumentAutofill = async (): Promise<
        Awaited<ReturnType<typeof resolveDocumentParserAutofill>>
      > => {
        if (documentAutofillAttempted) {
          uploadStageDebug(REQ, 'DOC-AUTOFILL', 'skipped duplicate', {
            hadResult: documentAutofillCache != null,
          });
          if (documentAutofillCache !== undefined) {
            return documentAutofillCache;
          }
          return resolveDocumentParserAutofill(
            lastAffindaResult,
            fileBuffer,
            file.name,
            extractedText,
            { budget: parserBudget, timing: uploadTiming, skipExternalParsers: true }
          );
        }
        documentAutofillAttempted = true;
        const docStart = Date.now();
        uploadStageDebug(REQ, 'DOC-AUTOFILL', 'started', { fileSizeBytes: file.size });
        const result = await resolveDocumentParserAutofill(
          lastAffindaResult,
          fileBuffer,
          file.name,
          extractedText,
          { budget: parserBudget, timing: uploadTiming }
        );
        documentAutofillCache = result;
        uploadStageDebug(REQ, 'DOC-AUTOFILL', 'completed', {
          durationMs: Date.now() - docStart,
          accepted: !!result,
          provider: result?.provider,
        });
        return result;
      };

      if (isAffindaEnabled()) {
        try {
          console.log('🚀 Affinda enabled — trying document parse first...');
          uploadStageDebug(REQ, 'AFFINDA', 'request started', { fileSizeBytes: file.size });
          const affindaParser = new AffindaResumeParser();
          const affindaResult = await uploadTiming.measure('affindaMs', () =>
            affindaParser.parseResume(fileBuffer, file.name)
          );
          uploadStageDebug(REQ, 'AFFINDA', 'response received', {
            durationMs: uploadTiming.stages.affindaMs,
            confidence: affindaResult.confidence,
          });
          lastAffindaResult = affindaResult;

          if (affindaResult.rawText && affindaResult.rawText.length > extractedText.length) {
            const reprepared = prepareResumeTextForParsing(affindaResult.rawText);
            resumeDocumentProfile = reprepared.profile;
            extractedText =
              reprepared.text.length >= 50 ? reprepared.text : affindaResult.rawText;
            log('Re-prepared Affinda rawText (cover strip + column layout preserved)', {
              affindaRawLen: affindaResult.rawText.length,
              preparedLen: extractedText.length,
              types: reprepared.profile.types,
            });
          }

          if (isAffindaPrimaryAcceptable(affindaResult, resumeDocumentProfile)) {
            log('Skipping Eden enrichment — Affinda primary payload is acceptable', {
              fileSizeBytes: file.size,
              experience: affindaResult.experience?.length ?? 0,
              education: affindaResult.education?.length ?? 0,
              skills: affindaResult.skills?.length ?? 0,
              confidence: affindaResult.confidence,
            });
            const enriched = {
              data: affindaResult,
              provider: 'affinda',
              affindaData: affindaResult,
            };
            provenanceAffinda = enriched.affindaData;
            provenanceEden = null;
            parsedData = mapExtractedToUploadProfile(enriched.data, {
              aiProvider: enriched.provider,
            });
            aiSuccess = true;
            aiProvider = enriched.provider;
            usedAffindaPrimary = true;
            console.log(
              '✅ Affinda primary extraction accepted (confidence:',
              affindaResult.confidence,
              ')'
            );
          } else {
            const quality = shouldPreferHybridOverAffinda(affindaResult, resumeDocumentProfile);
            hybridSkippedReason = quality.reasons.join(', ') || 'not_usable';

            // Layout-tolerant path: keep usable Affinda data (multi-column, executive, etc.)
            if (hasMinimalAutofillPayload(affindaResult)) {
              const affindaWithText = mergeTextRecoveryIntoExtracted(affindaResult, extractedText);
              const layoutNeedsBetterParser =
                quality.prefer && (affindaWithText.experience?.length ?? 0) === 0;
              if (
                hasMinimalAutofillPayload(affindaWithText) &&
                !layoutNeedsBetterParser
              ) {
                provenanceAffinda = affindaResult;
                parsedData = mapExtractedToUploadProfile(affindaWithText, {
                  aiProvider: 'affinda+text-recovery',
                });
                aiSuccess = true;
                aiProvider = 'affinda+text-recovery';
                usedAffindaPrimary = true;
                log('Affinda accepted via layout-tolerant path (minimal payload)', {
                  layoutReasons: quality.reasons,
                  experience: affindaWithText.experience?.length ?? 0,
                  education: affindaWithText.education?.length ?? 0,
                  skills: affindaWithText.skills?.length ?? 0,
                });
              } else {
                console.warn('⚠️ Affinda not primary-acceptable — Hybrid fallback', quality);
              }
            } else {
              console.warn('⚠️ Affinda not primary-acceptable — Hybrid fallback', quality);
            }
          }
        } catch (affindaPrimaryError) {
          console.warn(
            '⚠️ Affinda primary parse failed, using AI fallback chain:',
            affindaPrimaryError instanceof Error ? affindaPrimaryError.message : affindaPrimaryError
          );
        }
      }

      if (!usedAffindaPrimary) {
        try {
          console.log('🌿 Trying Eden/ApiLayer/Affinda document parsers (no OpenAI required)...');
          const docAutofill = await runDocumentAutofill();
          if (docAutofill) {
            applyDocAutofill(docAutofill);
            console.log('✅ Document parser autofill accepted:', docAutofill.provider);
            console.log('   - Name:', parsedData.fullName || 'MISSING');
            console.log('   - Experience:', parsedData.experience?.length ?? 0);
            console.log('   - Education:', parsedData.education?.length ?? 0);
            console.log('   - Skills:', parsedData.skills?.length ?? 0);
          }
        } catch (docParserError) {
          console.warn(
            '⚠️ Document parser autofill failed:',
            docParserError instanceof Error ? docParserError.message : docParserError
          );
        }
      }

      if (!usedAffindaPrimary && !usedDocumentParser) {
      let aiExtractionStart: number | null = null;
      if (!parserBudget.shouldRunNextParser(AI_PARSER_MIN_BUDGET_MS)) {
        warn('Parser budget exceeded — skipping Hybrid AI', {
          remainingMs: parserBudget.remainingMs(),
          budgetMs: parserBudget.budgetMs,
        });
        hybridSkippedReason = 'parser_budget_exceeded';
        const docAutofill = await runDocumentAutofill();
        if (docAutofill) {
          applyDocAutofill(docAutofill);
        }
      } else {
      aiExtractionStart = Date.now();
      uploadStageDebug(REQ, 'AI', 'extraction started', {
        remainingBudgetMs: parserBudget.remainingMs(),
      });
      try {
        // Try HybridResumeAI when document parsers did not produce enough data
        console.log('🚀 Attempting HybridResumeAI extraction with REAL AI...');
        console.log('📄 Text preview being sent to AI (first 500 chars):');
        console.log(extractedText.substring(0, 500));
        console.log('📊 Text stats: length=' + extractedText.length + ', words=' + (extractedText.match(/[a-zA-Z]{3,}/g) || []).length);
        
        const hybridAI = new HybridResumeAI();
        const hybridResult = await hybridAI.parseResumeText(extractedText);
        console.log('📦 HybridResumeAI returned result');

      
      console.log('📦 HybridResumeAI raw result:', JSON.stringify(hybridResult, null, 2).substring(0, 1500));
      console.log('🔍 CRITICAL: Check if result contains fallback message:');
      console.log('   - Experience[0].role:', hybridResult.experience?.[0]?.role);
      console.log('   - Education[0].degree:', hybridResult.education?.[0]?.degree);
      console.log('   - Is fallback?', hybridResult.experience?.[0]?.role?.includes('not extracted'));
      
      if (hybridResult && hybridResult.personalInformation) {
        console.log('📊 HybridResumeAI result analysis:');
        console.log('   ✓ Has personalInformation:', !!hybridResult.personalInformation);
        console.log('   ✓ Name:', hybridResult.personalInformation.fullName || 'NOT FOUND');
        console.log('   ✓ Email:', hybridResult.personalInformation.email || 'NOT FOUND');
        console.log('   ✓ Phone:', hybridResult.personalInformation.phone || 'NOT FOUND');
        console.log('   ✓ Location:', hybridResult.personalInformation.location || 'NOT FOUND');
        console.log('   ✓ Skills count:', (hybridResult.skills || []).length);
        console.log('   ✓ Experience count:', (hybridResult.experience || []).length);
        console.log('   ✓ Education count:', (hybridResult.education || []).length);
        
        // Show actual data
        if (hybridResult.skills && hybridResult.skills.length > 0) {
          console.log('   ✓ Skills:', hybridResult.skills.slice(0, 10));
        }
        if (hybridResult.experience && hybridResult.experience.length > 0) {
          console.log('   ✓ Experience:', hybridResult.experience.map((e: any) => `${e.company} - ${e.role}`));
        }
        if (hybridResult.education && hybridResult.education.length > 0) {
          console.log('   ✓ Education:', hybridResult.education.map((e: any) => `${e.institution} - ${e.degree}`));
        }
        
        // Placeholder strings vs text-recovery fallback are handled separately
        const hasPlaceholderStrings =
          hybridResult.experience?.[0]?.role?.includes('not extracted') ||
          hybridResult.education?.[0]?.degree?.includes('not extracted');
        const isTextRecoveryFallback = hybridResult.aiProvider === 'fallback';
        const hybridForPayloadCheck = hybridResultToExtracted(hybridResult);

        if (isImportFieldTraceEnabled()) {
          traceImportStageOutput('3_hybrid_parser_output', hybridForPayloadCheck, hybridResult.aiProvider || 'hybrid');
        }

        let shouldMapHybrid = false;
        let hybridAiProvider: string = hybridResult.aiProvider || 'hybrid';

        const tryDocumentParserAfterHybridReject = async (reason: string): Promise<boolean> => {
          console.warn(`⚠️ Hybrid rejected (${reason}) — trying document + text parsers`);
          const docAutofill = await runDocumentAutofill();
          if (docAutofill && hasMinimalAutofillPayload(docAutofill.data)) {
            applyDocAutofill(docAutofill);
            console.log('✅ Recovered autofill via document parsers after Hybrid rejection');
            return true;
          }
          return false;
        };

        if (hasPlaceholderStrings) {
          const recovered = await tryDocumentParserAfterHybridReject('placeholder strings');
          if (!recovered) {
            throw new Error('AI returned fallback data - will use document/text extraction instead');
          }
        } else if (isTextRecoveryFallback) {
          if (hasMinimalAutofillPayload(hybridForPayloadCheck)) {
            log('Accepting Hybrid text-recovery fallback (minimal autofill payload)', {
              aiProvider: 'hybrid-text-recovery',
              experience: hybridForPayloadCheck.experience?.length ?? 0,
              education: hybridForPayloadCheck.education?.length ?? 0,
              skills: hybridForPayloadCheck.skills?.length ?? 0,
            });
            shouldMapHybrid = true;
            hybridAiProvider = 'hybrid-text-recovery';
          } else {
            const recovered = await tryDocumentParserAfterHybridReject('empty fallback payload');
            if (!recovered) {
              throw new Error('AI returned fallback data - will use document/text extraction instead');
            }
          }
        } else {
          shouldMapHybrid = true;
        }

        if (shouldMapHybrid) {
        // Transform HybridResumeAI format to our format. We now preserve EVERY
        // structured experience fields (`startDate`, `endDate`, `current`,
        // `description`, `location`), projects, languages — instead of dropping
        // them and re-deriving with `duration.split(' - ')`.
        const hybridStartFromDuration = (duration?: string): string =>
          (duration || '').split(/\s*[-–—]\s*/)[0]?.trim() || '';
        const hybridEndFromDuration = (duration?: string): string => {
          const end = (duration || '').split(/\s*[-–—]\s*/).slice(1).join(' ').trim();
          return /^(present|current|now|ongoing)$/i.test(end) ? '' : end;
        };
        parsedData = {
          name: hybridResult.personalInformation.fullName || '',
          fullName: hybridResult.personalInformation.fullName || '',
          email: hybridResult.personalInformation.email || '',
          phone: hybridResult.personalInformation.phone || '',
          address: hybridResult.personalInformation.location || '',
          location: hybridResult.personalInformation.location || '',
          linkedin: hybridResult.personalInformation.linkedin || '',
          portfolio: hybridResult.personalInformation.portfolio || '',
          github: hybridResult.personalInformation.github || '',
          // CRITICAL: top-level jobTitle was previously dropped. Templates
          // expect `currentTitle/jobTitle` for the header subtitle line.
          currentTitle: hybridResult.professionalInformation?.jobTitle || '',
          jobTitle: hybridResult.professionalInformation?.jobTitle || '',
          desiredJobTitle: hybridResult.professionalInformation?.jobTitle || '',
          profession: hybridResult.professionalInformation?.jobTitle || '',
          // Summary was previously '' — now we preserve whatever the prompt
          // pulled from the resume's profile / objective section.
          summary: (hybridResult.summary || '').toString(),
          skills: hybridResult.skills || [],
          experience: (hybridResult.experience || []).map((exp: any) => {
            const startDate = exp.startDate || hybridStartFromDuration(exp.duration);
            const endDateRaw = exp.endDate || hybridEndFromDuration(exp.duration);
            const current = typeof exp.current === 'boolean'
              ? exp.current
              : /present|current|now|ongoing/i.test(`${endDateRaw} ${exp.duration || ''}`);
            return {
              company: exp.company || exp.organization || exp.employer || '',
              position: exp.role || exp.position || '',
              job_title: exp.role || exp.position || '',
              location: exp.location || '',
              startDate,
              start_date: startDate,
              endDate: current ? '' : endDateRaw,
              end_date: current ? '' : endDateRaw,
              current,
              description: exp.description || (Array.isArray(exp.achievements) ? exp.achievements.join('\n') : '') || '',
              achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
            };
          }),
          education: (hybridResult.education || []).map((edu: any) => ({
            institution: edu.institution || '',
            degree: edu.degree || '',
            field: edu.field || '',
            year: edu.year || '',
            endDate: edu.year || '',
            gpa: edu.gpa || '',
          })),
          // Projects come straight from the prompt now.
          projects: Array.isArray(hybridResult.projects)
            ? hybridResult.projects
                .map((p: any, index: number) => {
                  const name = resolveProjectTitle(p, index);
                  if (!name) return null;
                  const technologies = Array.isArray(p.technologies)
                    ? p.technologies.join(', ')
                    : (p.technologies || '');
                  return {
                    name,
                    title: name,
                    description: p.description || p.summary || '',
                    technologies,
                    url: p.url || p.link || '',
                    link: p.url || p.link || '',
                  };
                })
                .filter(Boolean)
            : [],
          certifications: Array.isArray(hybridResult.certifications)
            ? hybridResult.certifications.map((cert: any) =>
                typeof cert === 'string' ? { name: cert } : cert
              )
            : [],
          // Languages now extracted by the AI prompt directly.
          languages: Array.isArray(hybridResult.languages)
            ? hybridResult.languages.map((l: any) =>
                typeof l === 'string'
                  ? { name: l, proficiency: '' }
                  : { name: l?.name || '', proficiency: l?.proficiency || '' }
              ).filter((l: any) => l.name)
            : [],
          confidence: hybridResult.confidence || 85,
        };
        aiSuccess = true;
        aiProvider = hybridAiProvider;
        console.log('✅ HybridResumeAI parsing successful');
        console.log('   - AI Provider:', aiProvider);
        console.log('   - Confidence:', parsedData.confidence, '%');
        console.log('   - Extracted name:', parsedData.fullName || 'MISSING');
        console.log('   - Extracted email:', parsedData.email || 'MISSING');
        console.log('   - Extracted phone:', parsedData.phone || 'MISSING');
        console.log('   - Skills extracted:', parsedData.skills.length);
        console.log('   - Experience entries:', parsedData.experience.length);
        console.log('   - Education entries:', parsedData.education.length);
        }
      } else {
        throw new Error('HybridResumeAI returned incomplete data');
      }
    } catch (hybridError) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ HybridResumeAI FAILED - Investigating why AI isn\'t working...');
      console.error('═══════════════════════════════════════════════════════');
      console.error('Error details:', hybridError);
      console.error('Error type:', hybridError instanceof Error ? hybridError.constructor.name : typeof hybridError);
      console.error('Error message:', hybridError instanceof Error ? hybridError.message : String(hybridError));
      console.error('Error stack:', hybridError instanceof Error ? hybridError.stack : 'No stack trace');
      console.error('');
      console.error('🔍 DIAGNOSTIC INFO:');
      console.error('  - OpenAI key present:', !!process.env.OPENAI_API_KEY);
      console.error('  - OpenAI key length:', process.env.OPENAI_API_KEY?.length || 0);
      console.error('  - OpenAI key starts with:', process.env.OPENAI_API_KEY?.substring(0, 8) || 'none');
      console.error('  - Gemini key present:', !!process.env.GEMINI_API_KEY);
      console.error('  - Gemini key length:', process.env.GEMINI_API_KEY?.length || 0);
      console.error('  - Gemini key starts with:', process.env.GEMINI_API_KEY?.substring(0, 8) || 'none');
      console.error('  - Text length being sent:', extractedText.length);
      console.error('  - Text word count:', (extractedText.match(/[a-zA-Z]{3,}/g) || []).length);
      console.error('═══════════════════════════════════════════════════════');
      if (!usedDocumentParser) {
        try {
          console.log('🌿 Hybrid failed — retrying Eden/Affinda + text recovery...');
          const docAutofill = await runDocumentAutofill();
          if (docAutofill) {
            applyDocAutofill(docAutofill);
            console.log('✅ Document parser autofill recovered after Hybrid failure');
          }
        } catch (docRetryError) {
          console.warn(
            '⚠️ Document parser retry failed:',
            docRetryError instanceof Error ? docRetryError.message : docRetryError
          );
        }
      }

      if (!usedDocumentParser && parserBudget.shouldRunNextParser(AI_PARSER_MIN_BUDGET_MS)) {
      console.warn('⚠️ Falling back to EnhancedResumeAI...');
      
      try {
        // Fallback to EnhancedResumeAI
        console.log('🔄 Attempting EnhancedResumeAI extraction...');
        const enhancedAI = new EnhancedResumeAI();
        const enhancedResult = await enhancedAI.extractResumeData(extractedText);
        console.log('📦 EnhancedResumeAI returned result');
        
        if (enhancedResult && enhancedResult.fullName) {
          console.log('📊 EnhancedResumeAI result received:', {
            name: enhancedResult.fullName || 'NOT FOUND',
            email: enhancedResult.email || 'NOT FOUND',
            phone: enhancedResult.phone || 'NOT FOUND',
            skillsCount: (enhancedResult.skills || []).length,
            experienceCount: (enhancedResult.experience || []).length,
            educationCount: (enhancedResult.education || []).length,
          });
          
          parsedData = mapExtractedToUploadProfile(enhancedResult, { aiProvider: 'enhanced-ai' });
          aiSuccess = true;
          aiProvider = 'enhanced-ai';
          console.log('✅ EnhancedResumeAI parsing successful');
          console.log('   - Confidence:', parsedData.confidence, '%');
          console.log('   - Extracted name:', parsedData.fullName || 'MISSING');
          console.log('   - Skills:', parsedData.skills.length);
          console.log('   - Experience:', parsedData.experience.length);
          console.log('   - Education:', parsedData.education.length);
        } else {
          throw new Error('EnhancedResumeAI returned incomplete data');
        }
      } catch (enhancedError) {
        console.error('═══════════════════════════════════════════════════════');
        console.error('❌ EnhancedResumeAI ALSO FAILED');
        console.error('═══════════════════════════════════════════════════════');
        console.error('Error details:', enhancedError);
        console.error('Error message:', enhancedError instanceof Error ? enhancedError.message : String(enhancedError));
        console.error('');
        console.error('🚨 CRITICAL: BOTH AI providers failed!');
        console.error('   This means either:');
        console.error('   1. API keys are invalid or expired');
        console.error('   2. API rate limits exceeded');
        console.error('   3. Network/firewall blocking API calls');
        console.error('   4. Extracted text is causing parsing errors');
        console.error('═══════════════════════════════════════════════════════');
        console.warn('⚠️ Falling back to Affinda...');

        // Reuse primary Affinda result when available — avoids a duplicate ~55s API call.
        try {
          if (lastAffindaResult && isUsableExtraction(lastAffindaResult)) {
            console.log('♻️ Reusing cached Affinda result from primary parse');
            parsedData = mapExtractedToUploadProfile(lastAffindaResult, {
              aiProvider: 'affinda',
            });
            aiSuccess = true;
            aiProvider = 'affinda';
            console.log('✅ Affinda parsing successful (cached)');
            console.log('   - Confidence:', parsedData.confidence, '%');
            console.log('   - Skills:', parsedData.skills.length);
            console.log('   - Experience:', parsedData.experience.length);
            console.log('   - Education:', parsedData.education.length);
          } else if (lastAffindaResult) {
            throw new Error('Cached Affinda result unusable — skipping duplicate parse');
          } else {
            console.log('🔄 Attempting Affinda Resume Parser extraction...');
            const affindaParser = new AffindaResumeParser();

            if (affindaParser.isAvailable()) {
              const affindaResult = await affindaParser.parseResume(fileBuffer, file.name);
              lastAffindaResult = affindaResult;
              console.log('📦 Affinda returned result');

              if (affindaResult && isUsableExtraction(affindaResult)) {
                console.log('📊 Affinda result received:', {
                  name: affindaResult.fullName || 'NOT FOUND',
                  email: affindaResult.email || 'NOT FOUND',
                  phone: affindaResult.phone || 'NOT FOUND',
                  skillsCount: (affindaResult.skills || []).length,
                  experienceCount: (affindaResult.experience || []).length,
                  educationCount: (affindaResult.education || []).length,
                });

                parsedData = mapExtractedToUploadProfile(affindaResult, {
                  aiProvider: 'affinda',
                });
                aiSuccess = true;
                aiProvider = 'affinda';
                console.log('✅ Affinda parsing successful');
                console.log('   - Confidence:', parsedData.confidence, '%');
                console.log('   - Skills:', parsedData.skills.length);
                console.log('   - Experience:', parsedData.experience.length);
                console.log('   - Education:', parsedData.education.length);
              } else {
                throw new Error('Affinda returned incomplete data');
              }
            } else {
              console.log('⚠️ Affinda not available (no API key), skipping to basic extraction');
              throw new Error('Affinda not configured');
            }
          }
        } catch (affindaError) {
          console.error('❌ Affinda also failed, using basic extraction:', affindaError);
          const docAutofill = await runDocumentAutofill();
          if (docAutofill) {
            applyDocAutofill(docAutofill);
          } else {
            parsedData = await parseResumeBasic(extractedText, session);
            aiProvider = 'basic';
          }
        }
      }
      }
    }
      if (aiExtractionStart !== null) {
        uploadTiming.record('aiExtractionMs', Date.now() - aiExtractionStart);
        uploadStageDebug(REQ, 'AI', 'extraction completed', {
          durationMs: Date.now() - aiExtractionStart,
          aiProvider,
          aiSuccess,
        });
      }
      }
    }
    }

    parsedData = normalizeUploadProfile(parsedData || {});

    // CRITICAL: Augment sparse Affinda/AI results with text-recovery extraction.
    // We ONLY fill empty arrays — never overwrite what the primary parser found.
    // This is what catches "CERTIFICATIONS & LANGUAGES" combined sections,
    // grouped technical skills, projects with bullet points, etc., when the
    // primary parser returns flat or empty data for those sections.
    let recoveredFullName = '';
    let lastRecovered: Awaited<
      ReturnType<(typeof import('@/lib/resume-parser/text-recovery'))['extractResumeFromText']>
    > | null = null;
    try {
      const { extractResumeFromText } = await import('@/lib/resume-parser/text-recovery');
      const text = (extractedText || '').trim();
      if (!customParserUsed && text.length > 100) {
        const recovered = extractResumeFromText(text);
        lastRecovered = recovered;
        if (!parsedData.email && recovered.email) {
          parsedData.email = recovered.email;
        }

        const emailForName = String(parsedData.email || recovered.email || '');
        const recoveredCandidate = String(recovered.fullName || '').trim();
        recoveredFullName = isPlausiblePersonName(recoveredCandidate) ? recoveredCandidate : '';

        const emailForMerge = String(parsedData.email || recovered.email || '');
        const locationHint = String(parsedData.location || parsedData.address || '');
        const existingContactName = String(parsedData.fullName || parsedData.name || '').trim();
        if (!isValidatedContactName(existingContactName, locationHint)) {
          const parserCandidate = isPlausiblePersonName(parsedData.fullName || parsedData.name || '')
            ? String(parsedData.fullName || parsedData.name || '').trim()
            : '';
          const emailDerived = deriveDisplayNameFromEmail(emailForMerge);
          const mergedFullName = pickBestNameFromCandidates(
            [
              ...collectNameCandidatesFromText(text),
              ...(parserCandidate
                ? [{ value: parserCandidate, confidence: 72, source: 'affinda' as const }]
                : []),
              ...(recoveredFullName
                ? [{ value: recoveredFullName, confidence: 60, source: 'text_recovery' as const }]
                : []),
              ...(emailDerived
                ? [
                    {
                      value: emailDerived,
                      confidence: isPlausiblePersonName(emailDerived) ? 82 : 42,
                      source: 'email_derived' as const,
                    },
                  ]
                : []),
            ],
            emailForMerge
          );
          if (mergedFullName) {
            parsedData.fullName = mergedFullName;
            parsedData.name = mergedFullName;
          }
        }

        const before = {
          fullName: parsedData.fullName || '(empty)',
          skills: parsedData.skills?.length || 0,
          experience: parsedData.experience?.length || 0,
          education: parsedData.education?.length || 0,
          projects: parsedData.projects?.length || 0,
          certifications: parsedData.certifications?.length || 0,
          languages: parsedData.languages?.length || 0,
        };

        // Skills: union (preserves Affinda set + adds anything Affinda missed in
        // grouped sub-blocks like "Frameworks: Django, React.js, Node.js")
        if (Array.isArray(recovered.skills) && recovered.skills.length > 0) {
          const existing = new Set(
            (parsedData.skills || [])
              .map((s: unknown) =>
                String(typeof s === 'string' ? s : (s as { name?: string })?.name || '').toLowerCase()
              )
              .filter(Boolean)
          );
          const merged = [...(parsedData.skills || [])];
          for (const s of recovered.skills) {
            if (!existing.has(s.toLowerCase())) {
              merged.push(s);
              existing.add(s.toLowerCase());
            }
          }
          parsedData.skills = merged;
        }

        // Certifications: field-level enrichment.
        // Affinda often returns just { name } with empty issuer/date — pull
        // those from text-recovery's matching entry. Append any net-new certs.
        const recoveredCerts = recovered.certifications || [];
        if (recoveredCerts.length > 0) {
          const existingCerts = (parsedData.certifications || []) as any[];
          const sluggish = (s: unknown): string =>
            String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
          const matchCert = (a: any, b: any): boolean => {
            const aw = sluggish(a?.name).split(/\s+/).filter((w) => w.length >= 4);
            const bw = sluggish(b?.name).split(/\s+/).filter((w) => w.length >= 4);
            return aw.length > 0 && bw.length > 0 && aw.some((w) => bw.includes(w));
          };

          const usedRec = new Set<number>();
          const enriched = existingCerts.map((c: any) => {
            const matchIdx = recoveredCerts.findIndex((r, i) => !usedRec.has(i) && matchCert(c, r));
            const m = matchIdx >= 0 ? recoveredCerts[matchIdx] : null;
            if (m) usedRec.add(matchIdx);
            return {
              ...c,
              name: c.name || m?.name || '',
              issuer: c.issuer || m?.issuer || '',
              date: c.date || m?.date || '',
              url: c.url || m?.url || '',
            };
          });
          for (let i = 0; i < recoveredCerts.length; i++) {
            if (usedRec.has(i)) continue;
            const cert = recoveredCerts[i];
            if (
              cert &&
              typeof cert === 'object' &&
              isPlausibleCertificationEntry(
                String((cert as { name?: string }).name || ''),
                String((cert as { issuer?: string }).issuer || '')
              )
            ) {
              enriched.push({ ...recoveredCerts[i] });
            }
          }
          parsedData.certifications = enriched;
        }

        // Languages: field-level enrichment.
        // Existing entries always have proficiency "Fluent" (normalizer default)
        // so we can't trust that signal alone — instead merge by name and
        // PREFER the recovered proficiency when it's a stronger signal
        // (Native / Professional / Conversational / Intermediate / Basic).
        const recoveredLangs = (recovered.languages || []) as Array<any>;
        if (recoveredLangs.length > 0) {
          const existingLangs = (parsedData.languages || []) as any[];
          const nameKey = (l: any): string =>
            String(l?.name || l?.language || '').toLowerCase().trim();
          const recByName = new Map<string, { name: string; proficiency: string }>();
          for (const r of recoveredLangs) {
            const item =
              typeof r === 'string'
                ? { name: r, proficiency: '' }
                : { name: String(r?.name || ''), proficiency: String(r?.proficiency || '') };
            if (item.name) recByName.set(item.name.toLowerCase(), item);
          }

          const merged: any[] = [];
          const used = new Set<string>();
          for (const l of existingLangs) {
            const key = nameKey(l);
            if (!key) continue;
            const r = recByName.get(key);
            // Prefer recovered proficiency when it's non-default and non-empty.
            const recProf = r?.proficiency?.trim();
            const haveRichRec = !!recProf && !/^fluent$/i.test(recProf);
            merged.push({
              ...l,
              name: l.name || r?.name || '',
              proficiency: haveRichRec ? recProf! : (l.proficiency || recProf || 'Fluent'),
            });
            used.add(key);
          }
          // Append any net-new recovered languages
          for (const [key, r] of recByName.entries()) {
            if (used.has(key)) continue;
            merged.push({ name: r.name, proficiency: r.proficiency || 'Fluent' });
          }
          parsedData.languages = merged;
        }
        const recoveredProjects = recovered.projects || [];
        if (recoveredProjects.length > 0) {
          const existingProjects = (parsedData.projects || []) as Array<Record<string, unknown>>;
          const slug = (s: unknown): string =>
            String(s || '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, ' ')
              .trim();
          const matchProject = (a: Record<string, unknown>, b: Record<string, unknown>): boolean => {
            const an = slug(a.name || a.title);
            const bn = slug(b.name || b.title);
            return !!(an && bn && (an === bn || an.includes(bn) || bn.includes(an)));
          };
          const normTech = (t: unknown): string => {
            if (Array.isArray(t)) {
              return t.map((x) => String(x ?? '').trim()).filter(Boolean).join(', ');
            }
            return String(t || '').trim();
          };
          const enrichProject = (
            base: Record<string, unknown>,
            from: Record<string, unknown>
          ): Record<string, unknown> => {
            const name = String(base.name || base.title || from.name || '').trim();
            const description = String(
              base.description || base.summary || from.description || ''
            ).trim();
            const technologies =
              normTech(base.technologies || base.tech_stack) ||
              normTech(from.technologies);
            const url = String(base.url || base.link || from.url || '').trim();
            return {
              ...base,
              name,
              title: String(base.title || base.name || from.name || name).trim(),
              description,
              summary: description,
              technologies,
              tech_stack: technologies,
              url,
              link: url,
            };
          };

          if (existingProjects.length === 0) {
            parsedData.projects = recoveredProjects.map((p) => enrichProject({}, p as Record<string, unknown>));
          } else {
            const usedRec = new Set<number>();
            const enriched = existingProjects.map((proj) => {
              const matchIdx = recoveredProjects.findIndex(
                (r, i) => !usedRec.has(i) && matchProject(proj, r as Record<string, unknown>)
              );
              const match = matchIdx >= 0 ? (recoveredProjects[matchIdx] as Record<string, unknown>) : null;
              if (matchIdx >= 0) usedRec.add(matchIdx);
              return enrichProject(proj, match || {});
            });
            for (let i = 0; i < recoveredProjects.length; i++) {
              if (usedRec.has(i)) continue;
              enriched.push(enrichProject({}, recoveredProjects[i] as Record<string, unknown>));
            }
            parsedData.projects = enriched;
          }
        }

        if (Array.isArray(recovered.hobbies) && recovered.hobbies.length > 0) {
          const existing = new Set(
            (parsedData.hobbies || [])
              .map((h: unknown) => String(typeof h === 'string' ? h : (h as { name?: string })?.name || '').toLowerCase())
              .filter(Boolean)
          );
          const mergedHobbies = [...(parsedData.hobbies || [])];
          for (const h of recovered.hobbies) {
            const key = String(h || '').trim().toLowerCase();
            if (!key || existing.has(key)) continue;
            existing.add(key);
            mergedHobbies.push(h);
          }
          parsedData.hobbies = mergedHobbies;
        }

        if (
          (!parsedData.summary || isSuspectSummary(String(parsedData.summary || ''))) &&
          recovered.summary
        ) {
          parsedData.summary = recovered.summary;
        }
        // Experience field-level enrichment.
        // Affinda commonly returns the position string but leaves company /
        // dates / description empty for some entries. Don't just replace when
        // the array is empty — also FILL missing fields per-entry from a
        // matched text-recovery entry.
        const recoveredExp = recovered.experience || [];
        if (recoveredExp.length > 0) {
          const existingExp = parsedData.experience || [];

          // Detect Affinda "stub" entries — only a position string filled in,
          // no company / no dates / no description. These are useless and
          // text-recovery's richer entries should win outright.
          const isStubEntry = (e: any): boolean => {
            const hasCompany = !!(e?.company && String(e.company).trim());
            const hasStart = !!(e?.start_date || e?.startDate);
            const hasEnd = !!(e?.end_date || e?.endDate);
            const hasDesc = !!(e?.description && String(e.description).trim());
            const hasAch = Array.isArray(e?.achievements) && e.achievements.length > 0;
            return !hasCompany && !hasStart && !hasEnd && !hasDesc && !hasAch;
          };
          const allStubs = existingExp.length > 0 && existingExp.every(isStubEntry);
          // If text-recovery is clearly richer (has descriptions / dates /
          // company) and Affinda's entries are all stubs, prefer recovery.
          const recoveryIsRich = recoveredExp.some(
            (e) => (e.description && e.description.length > 20) || (e.achievements && e.achievements.length > 0) || e.company
          );
          if (allStubs && recoveryIsRich) {
            log('experience: Affinda returned only stubs — overlaying with text-recovery entries');
            // Merge stub positions with recovery — keep Affinda's position
            // string if it differs, but fill everything else from recovery.
            const merged: any[] = [];
            const usedRec = new Set<number>();
            for (const exp of existingExp) {
              const matchIdx = findBestRecoveredMatchIndex(
                exp as Record<string, unknown>,
                recoveredExp as unknown as Record<string, unknown>[],
                usedRec,
                experienceMatchScore,
                experienceSectionMatch
              );
              const m = matchIdx >= 0 ? recoveredExp[matchIdx] : recoveredExp[merged.length];
              if (matchIdx >= 0) usedRec.add(matchIdx);
              else if (merged.length < recoveredExp.length) usedRec.add(merged.length);
              if (!m) {
                merged.push(exp);
                continue;
              }
              merged.push({
                company: m.company || '',
                position: exp.position || m.position || '',
                job_title: exp.position || m.position || '',
                startDate: m.startDate || '',
                endDate: m.endDate || '',
                start_date: m.startDate || '',
                end_date: m.endDate || '',
                description: m.description || '',
                achievements: m.achievements || [],
                current: m.current || false,
                location: m.location || '',
              });
            }
            for (let i = 0; i < recoveredExp.length; i++) {
              if (usedRec.has(i)) continue;
              const r = recoveredExp[i];
              merged.push({
                company: r.company || '',
                position: r.position || '',
                job_title: r.position || '',
                startDate: r.startDate || '',
                endDate: r.endDate || '',
                start_date: r.startDate || '',
                end_date: r.endDate || '',
                description: r.description || '',
                achievements: r.achievements || [],
                current: r.current || false,
                location: r.location || '',
              });
            }
            parsedData.experience = merged;
          } else if (existingExp.length === 0) {
            parsedData.experience = recoveredExp.map((exp) => ({
              company: exp.company || '',
              position: exp.position || '',
              job_title: exp.position || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              start_date: exp.startDate || '',
              end_date: exp.endDate || '',
              description: exp.description || '',
              achievements: exp.achievements || [],
              current: exp.current || false,
              location: exp.location || '',
            }));
          } else {
            // Enrich existing entries with text-recovery data where fields are empty.
            const usedRecoveryIdx = new Set<number>();
            parsedData.experience = existingExp
              .map((exp: any) => {
              const matchIdx = findBestRecoveredMatchIndex(
                exp as Record<string, unknown>,
                recoveredExp as unknown as Record<string, unknown>[],
                usedRecoveryIdx,
                experienceMatchScore,
                experienceSectionMatch
              );
              const match = matchIdx >= 0 ? recoveredExp[matchIdx] : null;
              if (match) usedRecoveryIdx.add(matchIdx);

              const positionRaw = String(
                exp.position || exp.title || exp.role || exp.job_title || ''
              ).trim();
              const companyRaw = String(exp.company || exp.organization || '').trim();
              if (
                (isExperienceBlurbFragment(positionRaw) || isExperienceBlurbFragment(companyRaw)) &&
                match
              ) {
                return {
                  company: match.company || '',
                  position: match.position || '',
                  job_title: match.position || '',
                  startDate: match.startDate || '',
                  endDate: match.endDate || '',
                  start_date: match.startDate || '',
                  end_date: match.endDate || '',
                  description: match.description || '',
                  achievements: match.achievements || [],
                  current: match.current || false,
                  location: match.location || '',
                };
              }
              if (isExperienceBlurbFragment(positionRaw) || isExperienceBlurbFragment(companyRaw)) {
                return null;
              }

              const hasDesc = !!(exp.description && String(exp.description).trim());
              const hasAchievements = Array.isArray(exp.achievements) && exp.achievements.length > 0;
              const hasCompany = !!(exp.company && String(exp.company).trim());
              const hasPosition = !!(exp.position || exp.title || exp.role || exp.job_title);
              const hasStart = !!(exp.start_date || exp.startDate);
              const hasEnd = !!(exp.end_date || exp.endDate);

              return {
                ...exp,
                company: hasCompany ? exp.company : (match?.company || exp.company || ''),
                position:
                  (hasPosition ? exp.position || exp.title || exp.role || exp.job_title : '') ||
                  match?.position ||
                  exp.title ||
                  exp.role ||
                  exp.job_title ||
                  '',
                job_title:
                  exp.job_title ||
                  exp.position ||
                  match?.position ||
                  exp.title ||
                  exp.role ||
                  '',
                startDate: hasStart ? (exp.start_date || exp.startDate) : (match?.startDate || ''),
                start_date: hasStart ? (exp.start_date || exp.startDate) : (match?.startDate || ''),
                endDate: hasEnd ? (exp.end_date || exp.endDate) : (match?.endDate || ''),
                end_date: hasEnd ? (exp.end_date || exp.endDate) : (match?.endDate || ''),
                description: match
                  ? preferRecoveredWording(match.description, hasDesc ? exp.description : '')
                  : exp.description || '',
                achievements: match
                  ? preferRecoveredStringList(
                      match.achievements,
                      hasAchievements ? exp.achievements : []
                    )
                  : hasAchievements
                    ? exp.achievements
                    : [],
                current:
                  exp.current === true ||
                  match?.current === true ||
                  /^(present|current|now|ongoing)$/i.test(String(exp.end_date || exp.endDate || match?.endDate || '')),
                location: exp.location || match?.location || '',
              };
            })
              .filter((exp: unknown) => exp != null);

            // Append any text-recovery entries that didn't match an existing one
            // (e.g. a 2nd job Affinda missed entirely).
            for (let i = 0; i < recoveredExp.length; i++) {
              if (usedRecoveryIdx.has(i)) continue;
              const exp = recoveredExp[i];
              parsedData.experience.push({
                company: exp.company || '',
                position: exp.position || '',
                job_title: exp.position || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                start_date: exp.startDate || '',
                end_date: exp.endDate || '',
                description: exp.description || '',
                achievements: exp.achievements || [],
                current: exp.current || false,
                location: exp.location || '',
              });
            }
          }
        }
        const recoveredEdu = recovered.education || [];
        if (recoveredEdu.length > 0) {
          const existingEdu = (parsedData.education || []) as Array<Record<string, unknown>>;
          if (existingEdu.length === 0) {
            parsedData.education = recoveredEdu.map((edu) => ({
              institution: edu.institution || '',
              school: edu.institution || '',
              Institution: edu.institution || '',
              degree: edu.degree || '',
              Degree: edu.degree || '',
              field: edu.field || '',
              Field: edu.field || '',
              year: edu.endDate || '',
              startDate: edu.startDate || '',
              endDate: edu.endDate || '',
              gpa: edu.gpa || '',
              description: edu.description || '',
            }));
          } else {
            const usedRec = new Set<number>();
            const enrichedEdu = existingEdu.map((edu) => {
              const matchIdx = findBestRecoveredMatchIndex(
                edu,
                recoveredEdu as unknown as Record<string, unknown>[],
                usedRec,
                educationMatchScore,
                educationSectionMatch
              );
              const m = matchIdx >= 0 ? recoveredEdu[matchIdx] : null;
              if (matchIdx >= 0) usedRec.add(matchIdx);
              const institution =
                String(edu.institution || edu.school || edu.Institution || m?.institution || '').trim();
              return {
                ...edu,
                institution,
                school: institution,
                Institution: institution,
                degree: String(edu.degree || edu.Degree || m?.degree || '').trim(),
                Degree: String(edu.degree || edu.Degree || m?.degree || '').trim(),
                field: String(edu.field || edu.Field || m?.field || '').trim(),
                Field: String(edu.field || edu.Field || m?.field || '').trim(),
                year: String(edu.year || edu.endDate || m?.endDate || '').trim(),
                startDate: String(edu.startDate || m?.startDate || '').trim(),
                endDate: String(edu.endDate || edu.year || m?.endDate || '').trim(),
                gpa: String(edu.gpa || edu.GPA || m?.gpa || '').trim(),
                description: String(edu.description || m?.description || '').trim(),
              };
            });
            for (let i = 0; i < recoveredEdu.length; i++) {
              if (usedRec.has(i)) continue;
              const edu = recoveredEdu[i];
              enrichedEdu.push({
                institution: edu.institution || '',
                school: edu.institution || '',
                Institution: edu.institution || '',
                degree: edu.degree || '',
                Degree: edu.degree || '',
                field: edu.field || '',
                Field: edu.field || '',
                year: edu.endDate || '',
                startDate: edu.startDate || '',
                endDate: edu.endDate || '',
                gpa: edu.gpa || '',
                description: edu.description || '',
              });
            }
            parsedData.education = enrichedEdu;
          }
        }

        // Verbatim wording from uploaded resume wins on matched sections (structure stays from AI).
        parsedData = applyRecoveredWordingToProfile(parsedData, recovered);

        // Re-normalize after augmentation (handles language object → string flattening, etc.)
        parsedData = normalizeUploadProfile(parsedData);

        const after = {
          fullName: parsedData.fullName || '(empty)',
          skills: parsedData.skills?.length || 0,
          experience: parsedData.experience?.length || 0,
          education: parsedData.education?.length || 0,
          projects: parsedData.projects?.length || 0,
          certifications: parsedData.certifications?.length || 0,
          languages: parsedData.languages?.length || 0,
        };
        log('text-recovery augmentation', { before, after });
      }
    } catch (augmentError) {
      warn('text-recovery augmentation failed', augmentError instanceof Error ? augmentError.message : augmentError);
    }

    const resumeEmail = String(parsedData.email || lastRecovered?.email || '');
    const emailForName = resumeEmail;
    const parserNameRaw = String(parsedData.fullName || parsedData.name || '').trim();
    const parserName = isPlausiblePersonName(parserNameRaw) ? parserNameRaw : '';
    const recoveredName = isPlausiblePersonName(recoveredFullName) ? recoveredFullName : '';
    const emailDerivedName = deriveDisplayNameFromEmail(emailForName);
    if (parserNameRaw && !parserName) {
      warn('Rejected implausible parser name', { parserNameRaw });
    }

    const edenName =
      provenanceEden && isPlausiblePersonName(provenanceEden.fullName)
        ? String(provenanceEden.fullName).trim()
        : '';
    const affindaName =
      provenanceAffinda && isPlausiblePersonName(provenanceAffinda.fullName)
        ? String(provenanceAffinda.fullName).trim()
        : '';

    const locationForName = String(parsedData.location || parsedData.address || '');
    const mergedContactName = String(parsedData.fullName || parsedData.name || '').trim();
    const finalName = isValidatedContactName(mergedContactName, locationForName)
      ? mergedContactName
      : pickBestNameFromCandidates(
          [
            ...collectNameCandidatesFromText(extractedText || ''),
            ...(affindaName ? [{ value: affindaName, confidence: 72, source: 'affinda' as const }] : []),
            ...(edenName ? [{ value: edenName, confidence: 78, source: 'eden' as const }] : []),
            ...(parserName && parserName !== affindaName
              ? [{ value: parserName, confidence: 70, source: 'affinda' as const }]
              : []),
            ...(recoveredName
              ? [{ value: recoveredName, confidence: 65, source: 'text_recovery' as const }]
              : []),
            ...(emailDerivedName
              ? [
                  {
                    value: emailDerivedName,
                    confidence: isPlausiblePersonName(emailDerivedName) ? 82 : 42,
                    source: 'email_derived' as const,
                  },
                ]
              : []),
          ],
          emailForName
        ) || '';

    console.log('👤 Name resolution:', {
      documentTypes: resumeDocumentProfile?.types || ['unknown'],
      primaryDocumentType: resumeDocumentProfile?.primaryType || 'unknown',
      recoveredName: recoveredName || 'none',
      parsedName: parserName || 'none',
      rejectedParserName: parserNameRaw && !parserName ? parserNameRaw : 'none',
      derivedFromEmail: emailDerivedName || 'none',
      sessionName: session.user.name || 'none',
      finalName,
    });

    // Enhanced field extraction with fallback parsing for missing fields
    const enhancedData = enhanceExtractedData(parsedData, extractedText);

    console.log('PARSED PROJECTS', parsedData.projects);
    console.log('RECOVERED PROJECTS', lastRecovered?.projects);
    console.log('ENHANCED PROJECTS', enhancedData.projects);
    logRawProjects(parsedData.projects || [], 'RAW PROJECTS parsedData');
    const splitProjects = splitMergedProjectEntries(
      (parsedData.projects || enhancedData.projects || []) as unknown[]
    );
    if (splitProjects.length !== (parsedData.projects || []).length) {
      console.log('PROJECT SPLIT', {
        before: (parsedData.projects || []).length,
        after: splitProjects.length,
      });
    }
    parsedData.projects = splitProjects;
    logRawProjects(splitProjects, 'RAW PROJECTS AFTER SPLIT');

    // Convert to the format expected by the frontend with ALL fields
    const profile = {
      fullName: finalName,
      name: finalName, // Add alias
      email: resumeEmail,
      phone: parsedData.phone || '',
      location: parsedData.address || parsedData.location || '',
      linkedin: enhancedData.linkedin || parsedData.linkedin || '',
      github: enhancedData.github || parsedData.github || '',
      portfolio: enhancedData.portfolio || parsedData.portfolio || '',
      website: enhancedData.website || '',
      summary: cleanMultiline(parsedData.summary || enhancedData.summary || ''),
      skills: parsedData.skills || [],
      experience: (parsedData.experience || []).map((exp: any) => {
        const company = exp.company || exp.organization || '';
        const position = exp.job_title || exp.position || exp.title || exp.role || '';
        const location = exp.location || '';
        const startDate = exp.start_date || exp.startDate || '';
        const endDateRaw = exp.end_date || exp.endDate || '';
        const isCurrent =
          exp.current === true ||
          !endDateRaw ||
          /^(present|current|now|ongoing)$/i.test(String(endDateRaw));
        // CRITICAL: when current, force endDate to '' so templates don't render
        // "Present" twice (once from endDate + once from current flag).
        const endDate = isCurrent ? '' : endDateRaw;
        // Single canonical Duration string — templates use this; current/endDate
        // are kept as boolean/empty markers so nothing else renders "Present".
        const duration = isCurrent
          ? (startDate ? `${startDate} - Present` : 'Present')
          : (exp.duration || computeDuration(startDate, endDate));

        const rawDescription =
          exp.description ||
          exp.summary ||
          (Array.isArray(exp.achievements) && exp.achievements.length
            ? exp.achievements
                .map((a: unknown) =>
                  typeof a === 'string' ? a : String((a as any)?.title ?? (a as any)?.description ?? '')
                )
                .filter(Boolean)
                .join('\n')
            : '') ||
          exp.responsibilities ||
          '';
        // Bullet-split the description BEFORE cleanString flattens it.
        const splitBullets = (text: string): string[] =>
          text
            .split(/\n|•|·|▪|‣|\u2023|\u25aa/)
            .map((s) => s.replace(/^[\s\-–—*•·]+/, '').trim())
            .filter((s) => s.length >= 3);
        let achievements: string[] = Array.isArray(exp.achievements)
          ? exp.achievements
              .map((a: unknown) => (typeof a === 'string' ? a : String((a as any)?.title ?? (a as any)?.description ?? '')))
              .filter(Boolean)
          : [];
        if (achievements.length === 0 && rawDescription) {
          const bullets = splitBullets(String(rawDescription));
          if (bullets.length > 1) achievements = bullets;
        }
        // Keep description in its ORIGINAL multi-line form. Previously this
        // ran `.replace(/\s+/g, ' ')` which flattened paragraphs to a single
        // line — templates that fall back to `description` (when no bullets
        // are present) lost all structure. We only collapse runs of spaces/
        // tabs WITHIN a line; newlines are preserved.
        const description = String(rawDescription)
          .replace(/\r\n/g, '\n')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        return {
          // Provide BOTH naming conventions for maximum compatibility
          company: company,
          Company: company,
          position: position,
          title: position,
          Position: position,
          location: location,
          Location: location,
          startDate: startDate,
          endDate: endDate,
          duration: duration,
          Duration: duration,
          current: isCurrent,
          description: description,
          Description: description,
          achievements: achievements,
          // explicit alias many templates read
          bullets: achievements,
        };
      }),
      education: (parsedData.education || []).map((edu: any) => {
        const institution = edu.institution || edu.school || edu.university || '';
        const degree = edu.degree || edu.qualification || '';
        const field = edu.field || edu.major || '';
        const startDate = edu.start_date || edu.startDate || '';
        const endDate = edu.year || edu.Year || edu.end_date || edu.endDate || edu.startDate || '';
        const gpa = edu.gpa || '';
        const description = edu.description || '';
        const location = edu.location || '';
        
        return {
          // Provide BOTH naming conventions for maximum compatibility
          institution: institution,
          Institution: institution, // Capitalized for template compatibility
          degree: degree,
          Degree: degree, // Capitalized for template compatibility
          field: field,
          Field: field, // Capitalized for template compatibility
          startDate: startDate,
          endDate: endDate,
          year: endDate, // Alias for single year display
          gpa: gpa,
          GPA: gpa, // Capitalized for template compatibility
          description: description,
          Description: description, // Capitalized for template compatibility
          location: location,
          Location: location // Capitalized for template compatibility
        };
      }),
      projects: splitProjects
        .map((proj: any, index: number) => {
          const name = resolveProjectTitle(proj, index);
          if (!name) return null;
          const rec = typeof proj === 'object' && proj ? proj : {};
          return {
            name,
            description:
              typeof proj === 'string' ? '' : String(rec.description || rec.summary || ''),
            technologies: rec.technologies || rec.tech_stack || [],
            url: rec.url || rec.link || '',
            startDate: rec.start_date || rec.startDate || '',
            endDate: rec.end_date || rec.endDate || '',
          };
        })
        .filter(Boolean),
      certifications: (parsedData.certifications || []).map((cert: any) => ({
        name: typeof cert === 'string' ? cert : (cert.name || cert.title || ''),
        issuer: cert.issuer || cert.organization || '',
        date: cert.date || cert.issued_date || '',
        url: cert.url || cert.link || ''
      })),
      // Enhanced: Extract languages, achievements, hobbies
      languages: (parsedData.languages || enhancedData.languages || []).map((lang: any) => 
        typeof lang === 'string' 
          ? { name: lang, proficiency: 'Fluent' } 
          : { name: lang.name || lang.language || '', proficiency: lang.proficiency || lang.level || 'Fluent' }
      ),
      achievements: (() => {
        const fromParsed = Array.isArray(parsedData.achievements) ? parsedData.achievements : [];
        const fromEnhanced = Array.isArray(enhancedData.achievements) ? enhancedData.achievements : [];
        const seen = new Set<string>();
        const out: string[] = [];
        for (const raw of [...fromParsed, ...fromEnhanced]) {
          const value =
            typeof raw === 'string' ? raw : String((raw as { title?: string })?.title || '');
          const key = value.trim().toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          out.push(value.trim());
        }
        return out;
      })(),
      hobbies: parsedData.hobbies || enhancedData.hobbies || [],
      expectedSalary: parsedData.expected_salary || parsedData.salary_expectation || '',
      preferredJobType: parsedData.preferred_job_type || 'Full-time',
      confidence: parsedData.confidence || 85,
      rawText: extractedText,
      atsSuggestions: [
        'Resume parsed using AI for maximum accuracy',
        'Skills and experience extracted automatically',
        'Ready for job matching and recommendations'
      ],
      jobSuggestions: generateJobSuggestions(parsedData)
    };

    console.log('FINAL PROJECTS COUNT', profile.projects?.length);
    console.log('FINAL PROJECT SAMPLE', profile.projects?.[0]);

    logUploadPipelineTrace({
      reqId: REQ,
      rawPdfText,
      ocrApplied,
      preparedText: extractedText,
      layout: resumeDocumentProfile,
      affinda: provenanceAffinda,
      eden: provenanceEden,
      recovery: lastRecovered,
      aiProvider,
      hybridSkippedReason,
    });
    uploadTiming.finalize(parserBudget);
    uploadTiming.log(REQ);
    logFullUploadProvenance({
      reqId: REQ,
      affinda: provenanceAffinda,
      eden: provenanceEden,
      recovery: lastRecovered,
      final: profile,
    });
    let builderFormData: Record<string, unknown> | undefined;
    try {
      const { transformImportDataToBuilder } = await import('@/lib/resume-builder/import-transformer');
      builderFormData = transformImportDataToBuilder(profile);
      logProfileFormDataAudit(REQ, profile, builderFormData);
      if (isImportFieldTraceEnabled()) {
        traceImportStageOutput('15_builder_form_data', builderFormData, aiProvider || 'builder');
      }
      (profile as Record<string, unknown>).builderFormData = builderFormData;
    } catch (auditErr) {
      warn('formData audit skipped', auditErr instanceof Error ? auditErr.message : auditErr);
    }

    log('FINAL PROFILE shape', {
      aiProvider,
      aiSuccess,
      fullName: profile.fullName || '(empty)',
      email: profile.email || '(empty)',
      phone: profile.phone || '(empty)',
      location: profile.location || '(empty)',
      linkedin: profile.linkedin || '(empty)',
      github: profile.github || '(empty)',
      portfolio: profile.portfolio || '(empty)',
      summaryChars: profile.summary?.length || 0,
      skillsCount: profile.skills.length,
      experienceCount: profile.experience.length,
      educationCount: profile.education.length,
      projectsCount: profile.projects.length,
      certificationsCount: profile.certifications.length,
      languagesCount: profile.languages.length,
      achievementsCount: profile.achievements.length,
      hobbiesCount: profile.hobbies.length,
    });
    if (profile.experience.length === 0) warn('NO experience parsed — check upstream parser output');
    if (profile.education.length === 0) warn('NO education parsed — check upstream parser output');
    if (profile.skills.length === 0) warn('NO skills parsed');
    
    // CRITICAL: Alert if arrays are empty (data loss issue)
    if (profile.skills.length === 0) {
      console.error('🚨 CRITICAL: SKILLS ARRAY IS EMPTY! AI extraction failed!');
      console.error('   - parsedData.skills:', parsedData.skills);
    }
    if (profile.experience.length === 0) {
      console.error('🚨 CRITICAL: EXPERIENCE ARRAY IS EMPTY! AI extraction failed!');
      console.error('   - parsedData.experience:', parsedData.experience);
    }
    if (profile.education.length === 0) {
      console.error('🚨 CRITICAL: EDUCATION ARRAY IS EMPTY! AI extraction failed!');
      console.error('   - parsedData.education:', parsedData.education);
    }
    
    console.log('📋 Detailed extraction results:');
    console.log('  - Skills:', profile.skills);
    console.log('  - Experience:', profile.experience.map((e: any) => `${e.company} - ${e.position}`));
    console.log('  - Education:', profile.education.map((e: any) => `${e.institution} - ${e.degree}`));
    console.log('  - Languages:', profile.languages.map((l: any) => `${l.name} (${l.proficiency})`));
    console.log('  - Achievements:', profile.achievements.length);
    console.log('  - Hobbies:', profile.hobbies.length);
    
    // CRITICAL: Log the exact structure for debugging template rendering AND auto-fill
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 FINAL PROFILE DATA STRUCTURE (What client receives):');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Experience Count:', profile.experience.length);
    if (profile.experience.length > 0) {
      console.log('First experience entry:', JSON.stringify(profile.experience[0], null, 2));
      console.log('All experience entries:', JSON.stringify(profile.experience, null, 2));
    } else {
      console.error('⚠️ WARNING: EXPERIENCE ARRAY IS EMPTY!');
    }
    
    console.log('Education Count:', profile.education.length);
    if (profile.education.length > 0) {
      console.log('First education entry:', JSON.stringify(profile.education[0], null, 2));
      console.log('All education entries:', JSON.stringify(profile.education, null, 2));
    } else {
      console.error('⚠️ WARNING: EDUCATION ARRAY IS EMPTY!');
    }
    console.log('═══════════════════════════════════════════════════════════');

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });
    
    if (!user) {
      console.log('👤 Creating new user from session data');
      user = await prisma.user.create({
        data: {
          email: session.user.email!,
          firstName: session.user.name?.split(' ')[0] || 'User',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          role: 'jobseeker',
          isActive: true,
          isVerified: true
        }
      });
      console.log('✅ Created new user:', user.id);
    } else {
      console.log('👤 Found existing user:', user.id);
    }

    // Update user profile with parsed data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: profile.fullName?.split(' ')[0] || user.firstName,
        lastName: profile.fullName?.split(' ').slice(1).join(' ') || user.lastName,
        phone: profile.phone || user.phone,
        location: profile.location || user.location,
        skills: JSON.stringify(profile.skills),
        bio: profile.summary || user.bio
      }
    });

    // Ensure single-source-of-truth for the user's "active" resume.
    //
    // Every other writer in the codebase (`/api/jobseeker/resumes`,
    // `/api/resume-builder/save`) already deactivates the user's previous
    // active resumes before creating a new row. This endpoint did not — which
    // meant a user could end up with multiple `isActive=true` rows and the
    // dashboard/applications/recruiter readers (which all implicitly assume a
    // single primary resume) would pick an arbitrary one. Deactivating here
    // keeps the contract: one user → one active Resume row → one parsed
    // profile shared by jobs, applications, AI matching, ATS score, etc.
    await prisma.resume.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    // Save resume to database with storage metadata
    uploadStageDebug(REQ, 'DB', 'save started');
    const dbSaveStart = Date.now();
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        mimeType: file.type,
        parsedData: {
          ...profile,
          storage: uploadResult.storage,
          gcsPath: uploadResult.gcsPath || undefined,
        } as any,
        atsScore: 90,
        isActive: true
      }
    });

    console.log(`✅ Ultimate resume upload completed: ${resume.id}`);
    uploadStageDebug(REQ, 'DB', 'saved', { durationMs: Date.now() - dbSaveStart, resumeId: resume.id });

    // Fetch job recommendations based on uploaded resume
    let recommendations = [];
    try {
      console.log('🎯 Fetching job recommendations for user...');
      const jobsResponse = await prisma.job.findMany({
        where: {
          isActive: true,
          OR: profile.skills.map((skill: string) => ({
            skills: { contains: skill, mode: 'insensitive' }
          }))
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          experienceLevel: true,
          salary: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          isRemote: true,
          isHybrid: true,
          skills: true,
          description: true,
          postedAt: true,
          createdAt: true
        }
      });

      // Calculate match scores
      recommendations = jobsResponse.map(job => {
        let score = 0;
        let reasons = [];

        // Skills match
        if (profile.skills && profile.skills.length > 0 && job.skills) {
          const jobSkills = parseJobSkillsField(job.skills);
          const matchingSkills = profile.skills.filter((skill: string) => 
            jobSkills.some((jobSkill: string) => 
              jobSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          if (matchingSkills.length > 0) {
            score += (matchingSkills.length / profile.skills.length) * 40;
            reasons.push(`${matchingSkills.length} skill(s) match: ${matchingSkills.join(', ')}`);
          }
        }

        // Location match
        if (profile.location && job.location) {
          if (job.location.toLowerCase().includes(profile.location.toLowerCase())) {
            score += 30;
            reasons.push('Location match');
          }
        }

        // Job type preference
        if (profile.preferredJobType && job.jobType === profile.preferredJobType) {
          score += 20;
          reasons.push('Preferred job type');
        }

        // Remote preference
        if (job.isRemote) {
          score += 10;
          reasons.push('Remote work available');
        }

        return {
          ...job,
          matchScore: Math.round(score),
          matchReasons: reasons
        };
      });

      // Sort by match score
      recommendations.sort((a, b) => b.matchScore - a.matchScore);
      console.log(`✅ Found ${recommendations.length} job recommendations`);
    } catch (recError) {
      console.error('⚠️ Failed to fetch recommendations (non-critical):', recError);
      // Don't fail the upload if recommendations fail
    }

    uploadStageDebug(REQ, 'TOTAL', 'pipeline finished', {
      durationMs: Date.now() - pipelineStartMs,
      fileSizeBytes: file.size,
      aiProvider,
      ...uploadTiming.stages,
    });

    flushImportFieldTraceReport();

    return NextResponse.json({
      success: true, 
      message: 'Resume uploaded and parsed successfully using AI',
      resumeId: resume.id,
      profile,
      extractedData: profile, // Add extractedData alias for component compatibility
      recommendations,
      aiSuccess: aiSuccess, // Use actual AI success status
      atsScore: 90,
      confidence: profile.confidence,
      aiProvider: aiProvider, // Use actual AI provider used
      processingTime: Date.now() - timestamp,
      storage: {
        type: uploadResult.storage,
        secure: uploadResult.storage === 'gcs',
        cloud: uploadResult.storage === 'gcs',
      },
      sources: {
        ai: aiSuccess,
        textExtraction: true,
        jobMatching: true
      },
      debug: {
        extractedTextLength: extractedText?.length || 0,
        aiProvider: aiProvider,
        aiSuccess: aiSuccess
      }
    });

  } catch (error: any) {
    uploadDiag(REQ, 'L-error-catch', {
      name: error?.name,
      message: error?.message,
    });
    console.error('❌ Ultimate resume upload error:', error);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to upload and parse resume';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Only remap errors that are explicitly about the uploaded file size check above.
      // Do NOT blanket-map "too large" — OCR/parser/API failures were misreported as 10MB file limits.
      if (/File size exceeds maximum limit/i.test(error.message)) {
        statusCode = 413;
      } else if (error.message.includes('401') || error.message.includes('auth')) {
        statusCode = 401;
        errorMessage = 'Authentication required. Please log in to upload your resume.';
      } else if (error.message.includes('400') || error.message.includes('invalid')) {
        statusCode = 400;
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: statusCode });
  }
}

/**
 * Extract text from uploaded file
 */
async function extractTextFromFile(file: File, bytes: ArrayBuffer): Promise<string> {
  try {
    console.log('📄 Extracting text from file:', file.name, 'Type:', file.type);
    
    if (file.type === 'text/plain') {
      const text = new TextDecoder().decode(bytes);
      console.log('✅ Plain text extracted, length:', text.length);
      return text;
    }
    
    if (file.type === 'application/pdf') {
      console.log('📄 Processing PDF file...');
      console.log('   - File size:', file.size, 'bytes (', (file.size / 1024).toFixed(2), 'KB)');
      try {
        const { parsePdfBuffer } = await import('@/lib/pdf-parse-safe');
        const pdfData = await parsePdfBuffer(Buffer.from(bytes));
        const text = pdfData.text;
        console.log('✅ PDF text extracted using pdf-parse');
        console.log('   - Text length:', text.length, 'characters');
        console.log('   - Number of pages:', pdfData.numpages || 'unknown');
        console.log('   - Text preview (first 300 chars):', text.substring(0, 300));
        
        // Validate the extracted text is not just binary/metadata
        const wordCount = (text.match(/[a-zA-Z]{3,}/g) || []).length;
        const lineCount = text.split('\n').filter(line => line.trim().length > 0).length;
        console.log('   - Word count:', wordCount, 'words');
        console.log('   - Line count:', lineCount, 'lines');
        
        // CRITICAL FIX: Accept ANY extracted text, even if minimal
        // Better to have limited data than reject the upload entirely
        const hasAnyText = text.length > 0;
        const hasSomeWords = wordCount > 0;
        
        if (hasAnyText && hasSomeWords) {
          console.log('   ✓ PDF text extraction successful (found', wordCount, 'words)');
          
          // If very little text, add a note but DON'T reject
          if (wordCount < 10) {
            console.warn('   ⚠️ Limited text extracted, PDF may be partially image-based');
            return text + '\n\n[Note: Limited text extracted from PDF. Some sections may need manual entry.]';
          }
          
          return text;
        } else {
          // Last resort: Return filename as text so upload doesn't fail
          console.warn('   ⚠️ No readable text found in PDF');
          console.warn('   - Returning filename as fallback to allow upload');
          return `Resume: ${file.name}\n\n[This PDF appears to contain no extractable text. Please complete your profile manually.]`;
        }
      } catch (pdfError) {
        console.error('❌ PDF parsing library error:', pdfError);
        console.error('   - Error type:', pdfError instanceof Error ? pdfError.message : 'Unknown');
        console.error('   - Falling back to allow upload with manual entry');
        // CRITICAL: Don't throw - return fallback text to allow upload
        return `Resume: ${file.name}\n\n[PDF parsing failed. Please complete your profile manually.]`;
      }
    }
    
    if (file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('📄 Processing Word document...');
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
        const text = result.value;
        console.log('✅ Word document text extracted, length:', text.length);
        return text;
      } catch (wordError) {
        console.error('❌ Word document parsing failed:', wordError);
        return `Resume: ${file.name}`;
      }
    }
    
    // Fallback
    const text = new TextDecoder().decode(bytes);
    const readableText = text.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return readableText.length > 50 ? readableText : `Resume: ${file.name}`;
  } catch (extractError) {
    console.error('❌ Text extraction failed:', extractError);
    return `Resume: ${file.name}`;
  }
}

/**
 * Map HybridResumeAI output to ExtractedResumeData for payload gates.
 */
function hybridResultToExtracted(hybrid: HybridResumeData): ExtractedResumeData {
  return {
    fullName: hybrid.personalInformation?.fullName || '',
    email: hybrid.personalInformation?.email || '',
    phone: hybrid.personalInformation?.phone || '',
    location: hybrid.personalInformation?.location || '',
    summary: hybrid.summary || '',
    skills: hybrid.skills || [],
    experience: (hybrid.experience || []).map((exp) => ({
      company: exp.company || '',
      position: exp.role || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: !!exp.current,
      description: exp.description || '',
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
    })),
    education: (hybrid.education || []).map((edu) => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      startDate: '',
      endDate: edu.year || '',
      gpa: edu.gpa || '',
    })),
    confidence: hybrid.confidence || 0,
    rawText: '',
  };
}

/**
 * Basic resume parsing — single source of truth.
 * Delegates to the section-aware text extractor in lib/resume-parser/text-recovery
 * so we never hardcode skills, never invent summaries, never emit "details not extracted".
 */
async function parseResumeBasic(text: string, session: any): Promise<any> {
  try {
    console.log('[basic-parser] using section-aware text extractor (no hardcoded keywords)');
    console.log('[basic-parser] raw text length:', text.length);

    // IMPORTANT: do NOT call cleanResumeText here — it collapses newlines and breaks
    // section detection. The extractor has its own newline-preserving cleaner.
    const { extractResumeFromText } = await import('@/lib/resume-parser/text-recovery');
    const r = extractResumeFromText(text);

    console.log('[basic-parser] extracted:', {
      name: r.fullName || '(none)',
      email: r.email || '(none)',
      phone: r.phone || '(none)',
      location: r.location || '(none)',
      skills: r.skills.length,
      experience: r.experience.length,
      education: r.education.length,
      projects: r.projects?.length || 0,
      certifications: r.certifications?.length || 0,
      languages: r.languages?.length || 0,
      summaryChars: r.summary.length,
      confidence: r.confidence,
    });

    return {
      name: r.fullName,
      fullName: r.fullName,
      email: r.email || session?.user?.email || '',
      phone: r.phone,
      address: r.location,
      location: r.location,
      linkedin: r.linkedin || '',
      portfolio: r.portfolio || '',
      summary: r.summary,
      skills: r.skills,
      experience: r.experience.map((exp) => ({
        company: exp.company,
        position: exp.position,
        job_title: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate || '',
        start_date: exp.startDate,
        end_date: exp.endDate || '',
        description: exp.description,
        achievements: exp.achievements,
        current: exp.current,
        location: exp.location || '',
      })),
      education: r.education.map((edu) => ({
        institution: edu.institution,
        school: edu.institution,
        degree: edu.degree,
        field: edu.field,
        year: edu.endDate || '',
        startDate: edu.startDate,
        endDate: edu.endDate,
        gpa: edu.gpa || '',
        description: edu.description || '',
      })),
      projects: (r.projects || []).map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        url: p.url || '',
      })),
      certifications: r.certifications || [],
      languages: r.languages || [],
      hobbies: r.hobbies || [],
      confidence: r.confidence,
    };
  } catch (basicError: any) {
    console.error('[basic-parser] failed:', basicError?.message || basicError);
    return {
      name: '',
      fullName: '',
      email: session?.user?.email || '',
      phone: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      summary: '',
      confidence: 10,
    };
  }
}



/**
 * Compute duration between start and end dates
 */
function computeDuration(startDate: string, endDate: string): string {
  if (!startDate) return '';
  if (!endDate || endDate.toLowerCase() === 'present') {
    return `${startDate} - Present`;
  }
  return `${startDate} - ${endDate}`;
}

function resolveProjectTitle(proj: unknown, index: number): string {
  if (typeof proj === 'string') {
    const name = proj.trim();
    return name || (index === 0 ? 'Software Project' : `Project ${index + 1}`);
  }
  if (!proj || typeof proj !== 'object') return '';

  const rec = proj as Record<string, unknown>;
  const name = String(
    rec.name ||
      rec.title ||
      rec.projectName ||
      rec.project_title ||
      rec.ProjectName ||
      rec.ProjectTitle ||
      ''
  ).trim();
  if (name) return name;

  const description = String(rec.description || rec.summary || '').trim();
  const techRaw = rec.technologies ?? rec.tech_stack ?? rec.techStack;
  const hasTech = Array.isArray(techRaw)
    ? techRaw.length > 0
    : String(techRaw || '').trim().length > 0;

  if (description || hasTech) {
    return index === 0 ? 'Software Project' : `Project ${index + 1}`;
  }

  return '';
}

/**
 * Enhance extracted data with missing fields using pattern matching
 * Extracts: languages, achievements, hobbies, URLs (LinkedIn, GitHub, Portfolio)
 */
function enhanceExtractedData(parsedData: any, rawText: string): any {
  const enhanced: any = {
    languages: [],
    achievements: [],
    hobbies: [],
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    summary: '',
    projects: []
  };
  
  if (!rawText) return enhanced;
  
  const lowerText = rawText.toLowerCase();
  const lines = rawText.split('\n').filter(line => line.trim());
  
  // Extract LinkedIn URL
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  if (linkedinMatch) {
    enhanced.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }
  
  // Extract GitHub URL
  const githubMatch = rawText.match(/github\.com\/([a-zA-Z0-9-]+)/i);
  if (githubMatch) {
    enhanced.github = `https://github.com/${githubMatch[1]}`;
  }
  
  // Extract Portfolio/Website URL
  const websiteMatch = rawText.match(/(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);
  if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')) {
    enhanced.portfolio = websiteMatch[0];
    enhanced.website = websiteMatch[0];
  }
  
  // Extract Languages Section
  const languagesSectionIndex = lines.findIndex(line => 
    /^(languages?|language skills?|spoken languages?|language proficienc(?:y|ies)|languages known):?\s*$/i.test(line.trim())
  );
  
  if (languagesSectionIndex !== -1) {
    // Get next 15 lines after "Languages" heading (was 5 — too narrow for
    // resumes that list many spoken languages).
    const languageLines = lines.slice(languagesSectionIndex + 1, languagesSectionIndex + 16);
    const commonLanguages = [
      'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 
      'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Italian', 'Dutch', 'Turkish',
      'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek', 'Hebrew',
      'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino', 'Bengali', 'Urdu',
      'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'
    ];
    
    languageLines.forEach(line => {
      const lineText = line.trim();
      // Stop if we hit another section heading
      if (/^[A-Z][A-Za-z\s]+:?\s*$/.test(lineText) && lineText.length < 30) return;
      
      // Check for language matches
      commonLanguages.forEach(lang => {
        if (lineText.toLowerCase().includes(lang.toLowerCase())) {
          // Extract proficiency level if present
          let proficiency = 'Fluent';
          if (/native|mother\s*tongue/i.test(lineText)) proficiency = 'Native';
          else if (/fluent|proficient|advanced/i.test(lineText)) proficiency = 'Fluent';
          else if (/intermediate|conversational/i.test(lineText)) proficiency = 'Intermediate';
          else if (/basic|beginner/i.test(lineText)) proficiency = 'Basic';
          
          // Only add if not already added
          if (!enhanced.languages.find((l: any) => l.name === lang)) {
            enhanced.languages.push({ name: lang, proficiency });
          }
        }
      });
    });
  }
  
  // Extract Achievements Section (as separate from experience)
  const achievementsSectionIndex = lines.findIndex(line => 
    /^(achievements?|key achievements?|notable achievements?|accomplishments?|awards?|awards (?:and|&) honou?rs|honou?rs|honou?rs (?:and|&) awards|recognition[s]?):?\s*$/i.test(line.trim())
  );
  
  if (achievementsSectionIndex !== -1) {
    // Get lines until next section (was 10 — bumped to 20 for richer
    // accomplishment lists)
    const achievementLines = lines.slice(achievementsSectionIndex + 1, achievementsSectionIndex + 21);
    achievementLines.forEach(line => {
      const lineText = line.trim();
      // Stop at next section
      if (/^[A-Z][A-Za-z\s]+:?\s*$/.test(lineText) && lineText.length < 30) return;
      
      // Add non-empty lines that look like achievements
      if (lineText.length > 10 && !lineText.startsWith('•') && !lineText.startsWith('-')) {
        enhanced.achievements.push(lineText);
      } else if ((lineText.startsWith('•') || lineText.startsWith('-')) && lineText.length > 10) {
        enhanced.achievements.push(lineText.substring(1).trim());
      }
    });
  }
  
  // Extract Hobbies/Interests Section
  const hobbiesSectionIndex = lines.findIndex(line => 
    /^(hobbies?|hobbies (?:and|&) interests|interests?|personal interests?|interests (?:and|&) hobbies|extracurricular(?:\s+activities)?|activities|passions):?\s*$/i.test(line.trim())
  );
  
  if (hobbiesSectionIndex !== -1) {
    // Get lines until next section (was 5 — bumped to 10)
    const hobbyLines = lines.slice(hobbiesSectionIndex + 1, hobbiesSectionIndex + 11);
    hobbyLines.forEach(line => {
      const lineText = line.trim();
      // Stop at next section
      if (/^[A-Z][A-Za-z\s]+:?\s*$/.test(lineText) && lineText.length < 30) return;
      
      // Split on commas or bullets
      const hobbies = lineText.split(/[,•\-]/).map(h => h.trim()).filter(h => h.length > 2 && h.length < 50);
      enhanced.hobbies.push(...hobbies);
    });
  }
  
  console.log('✨ Enhanced extraction results:');
  console.log('   - LinkedIn:', enhanced.linkedin || 'not found');
  console.log('   - GitHub:', enhanced.github || 'not found');
  console.log('   - Portfolio:', enhanced.portfolio || 'not found');
  console.log('   - Languages:', enhanced.languages.length);
  console.log('   - Achievements:', enhanced.achievements.length);
  console.log('   - Hobbies:', enhanced.hobbies.length);
  
  return enhanced;
}

/**
 * Generate job suggestions based on parsed resume data
 */
function generateJobSuggestions(parsedData: any): any[] {
  const suggestions = [];
  
  if (parsedData.skills && parsedData.skills.length > 0) {
    // Generate job suggestions based on skills
    if (parsedData.skills.some((skill: string) => ['JavaScript', 'React', 'Node.js'].includes(skill))) {
      suggestions.push({
        title: 'Frontend Developer',
        reason: 'Based on your JavaScript and React skills'
      });
    }
    
    if (parsedData.skills.some((skill: string) => ['Python', 'Java', 'C++'].includes(skill))) {
      suggestions.push({
        title: 'Backend Developer',
        reason: 'Based on your programming language expertise'
      });
    }
    
    if (parsedData.skills.some((skill: string) => ['AWS', 'Docker', 'Linux'].includes(skill))) {
      suggestions.push({
        title: 'DevOps Engineer',
        reason: 'Based on your cloud and infrastructure skills'
      });
    }
  }
  
  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      { title: 'Software Engineer', reason: 'General software development role' },
      { title: 'Technical Specialist', reason: 'Based on your technical background' }
    );
  }
  
  return suggestions;
}

