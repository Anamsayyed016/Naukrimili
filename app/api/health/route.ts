/**
 * Health Check API Endpoint
 * 
 * Comprehensive health monitoring for the job portal system
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/lib/middleware/monitoring-middleware';
import { MonitoringService } from '@/lib/services/monitoring-service';

export async function GET(request: NextRequest) {
  return healthCheck();
}

export async function HEAD(request: NextRequest) {
  try {
    // Quick health check
    const healthStatus = MonitoringService.getHealthStatus();
    
    if (healthStatus.overall === 'healthy') {
      return new Response(null, { 
        status: 200,
        headers: {
          'X-Health': 'OK',
          'X-Timestamp': new Date().toISOString()
        }
      });
    } else {
      return new Response(null, { 
        status: 503,
        headers: {
          'X-Health': 'DEGRADED',
          'X-Timestamp': new Date().toISOString()
        }
      });
    }
  } catch (error) {
    return new Response(null, { 
      status: 503,
      headers: {
        'X-Health': 'ERROR',
        'X-Timestamp': new Date().toISOString()
      }
    });
  }
}