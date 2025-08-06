import { NextRequest } from 'next/server';
import { unifiedJobService } from '@/lib/unified-job-service';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    let beforeStats, afterStats;
    
    try {
      // Get cache stats before clearing
      beforeStats = unifiedJobService.getCacheStats();
      
      // Clear the cache
      unifiedJobService.clearCache();
      
      // Get cache stats after clearing
      afterStats = unifiedJobService.getCacheStats();
  // TODO: Complete function implementation
}
    } catch (serviceError) {
      return Response.json({
        success: false,
        error: 'Service unavailable - cache clearing failed',
        timestamp: new Date().toISOString()}, { status: 503 })}
    
    return Response.json({
      success: true,
      message: 'Cache cleared successfully',
      before: beforeStats,
      after: afterStats,
      timestamp: new Date().toISOString()})} catch (error) {
    console.error("Error:", error);
    throw error}
    return handleApiError(error, {
      endpoint: 'POST /api/clear-cache',
      context: {
        timestamp: new Date().toISOString()
      }})}
}

export async function GET(request: NextRequest) {
  try {
    let stats;
    
    try {
      stats = unifiedJobService.getCacheStats();
  // TODO: Complete function implementation
}
    } catch (serviceError) {
      return Response.json({
        success: false,
        error: 'Service unavailable',
        cache: { size: 0, keys: [], status: 'unavailable' },
        timestamp: new Date().toISOString()}, { status: 503 })}
    
    return Response.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()})} catch (error) {
    console.error("Error:", error);
    throw error}
    return handleApiError(error, {
      endpoint: 'GET /api/clear-cache',
      context: {
        timestamp: new Date().toISOString()
      }})}
}
