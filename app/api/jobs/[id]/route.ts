import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSEOJobUrl } from "@/lib/seo-url-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15 compatibility: params can be a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    console.log('🔍 Fetching job details for ID:', resolvedParams.id);
    
    // SIMPLIFIED: If it's already a clean ID (numeric or simple string), use it directly
    // Only parse if it looks like a complex SEO URL (contains multiple hyphens or non-ID characters)
    let jobId: string | null = null;
    
    // Check if it's already a clean ID (numeric string, simple alphanumeric, or external job ID format)
    const isCleanId = /^[\d-]+$/.test(resolvedParams.id) || // Pure numeric or numeric with hyphens
                      /^(adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external|sample|job)-/.test(resolvedParams.id) || // External job ID
                      /^[a-zA-Z0-9_-]{1,50}$/.test(resolvedParams.id) && resolvedParams.id.split('-').length <= 3; // Simple string ID
    
    if (isCleanId) {
      // Already a clean ID, use it directly
      jobId = resolvedParams.id;
      console.log('✅ Using clean ID directly:', jobId);
    } else {
      // Looks like a complex SEO URL, parse it
      jobId = parseSEOJobUrl(resolvedParams.id);
      if (!jobId) {
        console.log('❌ Failed to parse SEO URL:', resolvedParams.id);
        return NextResponse.json(
          { 
            error: "Job not found",
            details: "Invalid job URL format. Please check the URL and try again.",
            success: false
          },
          { status: 404 }
        );
      }
      console.log('✅ Parsed SEO URL to ID:', jobId);
    }

    // Try to find job by ID with multiple strategies
    let job;
    
    // CRITICAL FIX: Check if ID is a large numeric string (10+ digits) - these MUST use sourceId
    // Large numeric IDs are stored in sourceId, not in the numeric id field
    const numericId = Number(jobId);
    const isNumericString = /^\d+$/.test(jobId);
    const isLargeNumericId = isNumericString && jobId.length >= 10; // 10+ digits
    const isSafeInteger = !isNaN(numericId) && Number.isSafeInteger(numericId) && numericId > 0;
    
    // Strategy 1: For large numeric IDs (10+ digits), ALWAYS try sourceId first
    // These are external job IDs that exceed safe integer limits
    // CRITICAL FIX: Some jobs have negative sourceIds (e.g., -8203584465841679000)
    // but URLs contain positive IDs (e.g., 8203584465841679000)
    // Try both positive and negative versions
    if (isLargeNumericId) {
      console.log('🔍 Large numeric ID detected (10+ digits), trying sourceId lookup first...');
      
      // Try positive sourceId first
      job = await prisma.job.findFirst({
        where: { sourceId: jobId },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              user: { select: { id: true, firstName: true, lastName: true, email: true } }
            }
          },
          _count: { select: { applications: true, bookmarks: true } }
        }
      });
      
      // If not found, try negative version (some jobs are stored with negative sourceIds)
      if (!job) {
        console.log('🔍 Trying negative sourceId variant...');
        const negativeSourceId = `-${jobId}`;
        job = await prisma.job.findFirst({
          where: { sourceId: negativeSourceId },
          include: {
            applications: {
              select: {
                id: true,
                status: true,
                appliedAt: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            },
            _count: { select: { applications: true, bookmarks: true } }
          }
        });
        if (job) {
          console.log('✅ Found job by negative sourceId:', job.title);
        }
      } else {
        console.log('✅ Found job by sourceId (large numeric ID):', job.title);
      }
      
      if (!job) {
        console.log('⚠️ Job not found by sourceId (tried both positive and negative), will try other strategies...');
      }
    }
    
    // Strategy 2: Try as numeric ID for database jobs (but only if it's a safe integer AND not already found)
    // JavaScript's Number.MAX_SAFE_INTEGER is 9007199254740991 (2^53 - 1)
    if (!job && isSafeInteger && !isLargeNumericId) {
      console.log('🔍 Trying Strategy 2 (numeric ID for database jobs)...');
      job = await prisma.job.findUnique({
        where: { id: numericId },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              applications: true,
              bookmarks: true
            }
          }
        }
      });
      console.log('✅ Strategy 2 (numeric ID):', job ? 'Found' : 'Not found');
    } else if (!job && !isSafeInteger && !isLargeNumericId) {
      console.log('⚠️ Skipping numeric ID strategy - ID is not a safe integer:', jobId);
    }
    
    // Strategy 3: Try by sourceId for all jobs (external-*, ext-*, string IDs, etc.)
    // This catches external jobs and any job with a sourceId match
    // CRITICAL FIX: Also try negative version for numeric IDs
    if (!job) {
      console.log('🔍 Trying Strategy 3 (sourceId for all job types):', jobId);
      job = await prisma.job.findFirst({
        where: { 
          sourceId: jobId
        },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              applications: true,
              bookmarks: true
            }
          }
        }
      });
      
      // If numeric ID and not found, try negative version
      if (!job && isNumericString && jobId.length >= 10) {
        console.log('🔍 Trying negative sourceId variant in Strategy 3...');
        const negativeSourceId = `-${jobId}`;
        job = await prisma.job.findFirst({
          where: { 
            sourceId: negativeSourceId
          },
          include: {
            applications: {
              select: {
                id: true,
                status: true,
                appliedAt: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                applications: true,
                bookmarks: true
              }
            }
          }
        });
        if (job) {
          console.log('✅ Found job by negative sourceId in Strategy 3:', job.title);
        }
      } else if (job) {
        console.log('✅ Found job by sourceId:', job.title);
      }
    }
    
    // Strategy 3: For IDs like "external-123456-1", extract the timestamp and try
    if (!job && jobId.startsWith('external-')) {
      const parts = jobId.split('-');
      if (parts.length >= 2) {
        const timestamp = parts[1];
        job = await prisma.job.findFirst({
          where: { 
            sourceId: {
              contains: timestamp
            }
          },
          include: {
            applications: {
              select: {
                id: true,
                status: true,
                appliedAt: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                applications: true,
                bookmarks: true
              }
            }
          }
        });
      }
    }

    // Strategy 4: For numeric IDs, try partial matching on sourceId (last 10+ digits)
    // This handles cases where the sourceId might have a prefix or suffix
    if (!job && isNumericString && jobId.length >= 10) {
      console.log('🔍 Strategy 4: Trying partial sourceId match (last digits)...');
      const lastDigits = jobId.slice(-15); // Last 15 digits
      // Try both positive and negative versions with contains
      const candidates = [lastDigits, `-${lastDigits}`];
      for (const candidate of candidates) {
        job = await prisma.job.findFirst({
          where: { 
            sourceId: { contains: candidate }
          },
          include: {
            applications: {
              select: {
                id: true,
                status: true,
                appliedAt: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            },
            _count: { select: { applications: true, bookmarks: true } }
          }
        });
        if (job) {
          console.log('✅ Found job by partial sourceId match:', job.title);
          break;
        }
      }
    }
    
    // Strategy 5: Wait for external job to be cached if it's a recent search
    // This handles race condition where user clicks job before background caching completes
    if (!job && !isSafeInteger) {
      console.log('🔍 Strategy 5: Waiting for potential external job caching...');
      
      // Wait a brief moment for background caching to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try sourceId lookup again (both positive and negative)
      job = await prisma.job.findFirst({
        where: { sourceId: jobId },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              user: { select: { id: true, firstName: true, lastName: true, email: true } }
            }
          },
          _count: { select: { applications: true, bookmarks: true } }
        }
      });
      
      if (!job && isNumericString && jobId.length >= 10) {
        const negativeSourceId = `-${jobId}`;
        job = await prisma.job.findFirst({
          where: { sourceId: negativeSourceId },
          include: {
            applications: {
              select: {
                id: true,
                status: true,
                appliedAt: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            },
            _count: { select: { applications: true, bookmarks: true } }
          }
        });
      }
      
      if (job) {
        console.log('✅ Found external job after waiting for cache:', job.title);
      }
    }
    
    if (!job) {
      console.log('❌ Job not found with any strategy:', jobId);
      console.log('🔍 Debug info:', {
        originalId: resolvedParams.id,
        parsedId: jobId,
        isNumericString,
        isLargeNumericId,
        isSafeInteger,
        numericId: numericId.toString()
      });
      
      // Additional debug: Try to find similar jobs to help diagnose
      if (isLargeNumericId) {
        const similarJobs = await prisma.job.findMany({
          where: {
            OR: [
              { sourceId: { contains: jobId.slice(-10) } }, // Last 10 digits
              { sourceId: { contains: `-${jobId}` } } // Negative version
            ]
          },
          select: { id: true, sourceId: true, title: true },
          take: 3
        });
        if (similarJobs.length > 0) {
          console.log('🔍 Found similar jobs:', similarJobs);
        }
      }
      
      return NextResponse.json(
        { 
          error: "Job not found",
          details: `No job found with ID: ${jobId}. The job may have expired or been removed.`,
          success: false,
          debug: process.env.NODE_ENV === 'development' ? {
            originalId: resolvedParams.id,
            parsedId: jobId,
            strategiesTried: ['large-numeric-sourceId', 'numeric-id', 'sourceId', 'negative-sourceId']
          } : undefined
        },
        { status: 404 }
      );
    }

    console.log('✅ Job found:', job.id, 'sourceId:', job.sourceId);

    // Increment views atomically (best-effort; ignore failures)
    const jobWithViews = job as typeof job & { views?: number };
    let updatedViews = jobWithViews.views || 0;
    try {
      // CRITICAL FIX: Ensure job.id is a valid integer before updating
      const jobIdNum = typeof job.id === 'number' ? job.id : parseInt(String(job.id), 10);
      if (!isNaN(jobIdNum) && Number.isSafeInteger(jobIdNum) && jobIdNum > 0) {
        const updated = await prisma.job.update({
          where: { id: jobIdNum },
          data: { views: { increment: 1 } },
          select: { views: true }
        });
        updatedViews = updated.views;
      } else {
        console.warn('⚠️ Skipping views increment - invalid job.id:', job.id);
      }
    } catch (_incErr: unknown) {
      // If job.id is not numeric or column missing, skip silently
      const incErrMessage = _incErr instanceof Error ? _incErr.message : 'Unknown error';
      console.warn('⚠️ Failed to increment views:', incErrMessage);
    }

    // Normalize response: expose applicationsCount and views consistently
    // CRITICAL FIX: Use correct relation name 'applications' (lowercase, plural) not 'Application'
    const jobWithCount = job as typeof job & { 
      _count?: { applications?: number; bookmarks?: number };
      applicationsCount?: number;
    };
    const applicationsCount = jobWithCount._count?.applications ?? jobWithCount.applicationsCount ?? 0;
    
    // Ensure country field is set (fix for "region not available" error)
    const country = job.country || 'IN'; // Default to India if not set
    
    // CRITICAL FIX: Construct safe response object to avoid Prisma serialization issues
    // NextResponse.json can handle Date objects, but we ensure _count is properly formatted
    const normalizedJob: Record<string, unknown> = {
      ...job,
      country, // Ensure country is always present
      applicationsCount,
      views: updatedViews,
      // Ensure _count is properly structured (fix for undefined _count.Application error)
      _count: {
        applications: applicationsCount,
        bookmarks: jobWithCount._count?.bookmarks ?? 0
      }
    };
    
    // Remove any undefined values that might cause serialization issues
    Object.keys(normalizedJob).forEach(key => {
      if (normalizedJob[key] === undefined) {
        delete normalizedJob[key];
      }
    });

    return NextResponse.json({
      success: true,
      data: normalizedJob
    });

  } catch (error: unknown) {
    console.error("❌ Error fetching job details:", error);
    const errorObj = error instanceof Error ? error : { message: 'Unknown error', stack: undefined };
    console.error("❌ Error stack:", errorObj.stack);
    console.error("❌ Error message:", errorObj.message);
    
    // Provide more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? errorObj.message || "Failed to fetch job details"
      : "Failed to fetch job details";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15 compatibility: params can be a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const jobId = parseInt(resolvedParams.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting job ${jobId}...`);

    // Delete the job
    await prisma.job.delete({
      where: { id: jobId }
    });

    console.log(`✅ Job ${jobId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}