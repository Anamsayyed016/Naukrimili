import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { AdvancedResumeValidator, ParsedResumeData, DataSource } from '@/lib/advanced-resume-validator';
import { HybridResumeAI } from '@/lib/hybrid-resume-ai';

/**
 * POST /api/resumes/advanced-validate
 * 
 * Advanced Resume Validation API
 * 
 * This endpoint validates and merges multiple data sources:
 * 1. Parser output (PyResparser) - may be incomplete or messy
 * 2. Gemini AI parsed output - first draft JSON
 * 3. Original resume text - the ground truth
 * 
 * Features:
 * - Validates email and phone formats
 * - Extracts multiple items where applicable
 * - Corrects mistakes using original text
 * - Returns only valid JSON following strict schema
 * - Non-disruptive to existing codebase
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Advanced resume validation API called');
    
    // Get user session for authentication
    const session = await auth();
    
    if (!session || !session.user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required. Please log in to validate your resume.' 
      }, { status: 401 });
    }

    console.log('👤 Authenticated user:', session.user.email);
    
    const body = await request.json();
    const { parserData, geminiData, originalText } = body;

    // Validate required parameters
    if (!originalText || typeof originalText !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Original resume text is required'
      }, { status: 400 });
    }

    if (!parserData && !geminiData) {
      return NextResponse.json({
        success: false,
        error: 'At least one data source (parser or gemini) is required'
      }, { status: 400 });
    }

    console.log('📊 Input validation:');
    console.log('   Parser data provided:', !!parserData);
    console.log('   Gemini data provided:', !!geminiData);
    console.log('   Original text length:', originalText.length);

    // Initialize the advanced validator
    const validator = new AdvancedResumeValidator();
    
    // Prepare data sources
    const dataSources: DataSource = {
      parserData,
      geminiData,
      originalText
    };

    // If no Gemini data provided, try to generate it using existing HybridResumeAI
    if (!geminiData && originalText) {
      console.log('🤖 Generating Gemini data using existing HybridResumeAI...');
      try {
        const hybridAI = new HybridResumeAI();
        const hybridResult = await hybridAI.parseResumeText(originalText);
        
        // Convert HybridResumeData to our expected format
        const convertedGeminiData = {
          name: hybridResult.personalInformation.fullName,
          email: hybridResult.personalInformation.email,
          phone: hybridResult.personalInformation.phone,
          address: hybridResult.personalInformation.location,
          skills: hybridResult.skills,
          education: hybridResult.education.map(edu => ({
            degree: edu.degree,
            institution: edu.institution,
            year: edu.year
          })),
          experience: hybridResult.experience.map(exp => ({
            job_title: exp.role,
            company: exp.company,
            start_date: exp.duration.split(' - ')[0] || '',
            end_date: exp.duration.split(' - ')[1] || '',
            description: exp.achievements.join('; ')
          })),
          projects: [], // Not in HybridResumeData
          certifications: hybridResult.certifications
        };
        
        dataSources.geminiData = convertedGeminiData;
        console.log('✅ Gemini data generated successfully');
      } catch (_error) {
        console.warn('⚠️ Failed to generate Gemini data:', error);
      }
    }

    // Perform advanced validation and merging
    const startTime = Date.now();
    const validatedData: ParsedResumeData = await validator.validateAndMerge(dataSources);
    const processingTime = Date.now() - startTime;

    // Validate the final result
    const validationResult = validator.validateParsedData(validatedData);

    console.log('📊 Validation Results:');
    console.log('   Valid:', validationResult.isValid);
    console.log('   Confidence:', validationResult.confidence + '%');
    console.log('   Errors:', validationResult.errors.length);
    console.log('   Warnings:', validationResult.warnings.length);
    console.log('   Processing time:', processingTime + 'ms');

    // Return comprehensive response
    const response = {
      success: true,
      message: 'Resume validation completed successfully',
      data: validatedData,
      validation: {
        isValid: validationResult.isValid,
        confidence: validationResult.confidence,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        processingTime
      },
      metadata: {
        sourcesUsed: {
          parser: !!parserData,
          gemini: !!dataSources.geminiData,
          originalText: true
        },
        timestamp: new Date().toISOString(),
        userId: session.user.id
      }
    };

    return NextResponse.json(response);

  } catch (_error) {
    console.error('❌ Advanced resume validation error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate resume data',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/resumes/advanced-validate
 * 
 * Get validation schema and documentation
 */
export async function GET(_request: NextRequest) {
  try {
    const documentation = {
      title: 'Advanced Resume Validator API',
      description: 'Validates and merges multiple resume data sources with advanced error correction',
      version: '1.0.0',
      endpoints: {
        POST: {
          path: '/api/resumes/advanced-validate',
          description: 'Validate and merge resume data from multiple sources',
          parameters: {
            parserData: {
              type: 'object',
              description: 'PyResparser output (optional)',
              required: false
            },
            geminiData: {
              type: 'object', 
              description: 'Gemini AI parsed output (optional)',
              required: false
            },
            originalText: {
              type: 'string',
              description: 'Original resume text (required)',
              required: true
            }
          },
          response: {
            success: 'boolean',
            data: 'ParsedResumeData',
            validation: 'ValidationResult',
            metadata: 'object'
          }
        }
      },
      schema: {
        ParsedResumeData: {
          name: 'string',
          email: 'string (valid email format)',
          phone: 'string (valid phone format)',
          address: 'string',
          skills: 'string[]',
          education: 'EducationEntry[]',
          experience: 'ExperienceEntry[]',
          projects: 'string[]',
          certifications: 'string[]'
        },
        EducationEntry: {
          degree: 'string',
          institution: 'string',
          year: 'string'
        },
        ExperienceEntry: {
          job_title: 'string',
          company: 'string',
          start_date: 'string',
          end_date: 'string',
          description: 'string'
        }
      },
      features: [
        'Email and phone format validation',
        'Multiple data source merging',
        'Original text ground truth validation',
        'Duplicate removal',
        'Comprehensive field extraction',
        'Error correction and enhancement'
      ],
      examples: {
        request: {
          parserData: {
            name: 'John Doe',
            email: 'john@example.com',
            skills: ['JavaScript', 'React']
          },
          geminiData: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            skills: ['JavaScript', 'Node.js', 'React']
          },
          originalText: 'John Doe\nSoftware Engineer\nEmail: john.doe@example.com\nPhone: +1-555-123-4567\n...'
        },
        response: {
          success: true,
          data: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-123-4567',
            address: '',
            skills: ['JavaScript', 'React', 'Node.js'],
            education: [],
            experience: [],
            projects: [],
            certifications: []
          },
          validation: {
            isValid: true,
            confidence: 95,
            errors: [],
            warnings: ['No work experience found']
          }
        }
      }
    };

    return NextResponse.json(documentation);

  } catch (_error) {
    console.error('❌ Documentation API error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to retrieve documentation'
    }, { status: 500 });
  }
}
