'use client';

import { useState } from 'react';
import { 
  getSmartLocation, 
  getMobileGeolocationOptions, 
  isMobileDevice, 
  getGeolocationDiagnostics,
  getCurrentLocationGPS,
  getLocationFromIP
} from '@/lib/mobile-geolocation';

export default function TestGeolocationPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(testName);
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, [testName]: { error: error.message } }));
    } finally {
      setLoading(null);
    }
  };

  const diagnostics = getGeolocationDiagnostics();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Geolocation Debug Test</h1>
        
        {/* Diagnostics */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Diagnostics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Geolocation Supported:</strong> {diagnostics.supported ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Is Mobile:</strong> {diagnostics.isMobile ? '📱 Yes' : '💻 No'}
            </div>
            <div>
              <strong>Needs HTTPS:</strong> {diagnostics.needsHTTPS ? '🔒 Yes' : '🔓 No'}
            </div>
            <div>
              <strong>Is Localhost:</strong> {diagnostics.isLocalhost ? '🏠 Yes' : '🌐 No'}
            </div>
            <div>
              <strong>Protocol:</strong> {diagnostics.protocol}
            </div>
            <div>
              <strong>User Agent:</strong> {diagnostics.userAgent.substring(0, 50)}...
            </div>
          </div>
          {diagnostics.recommendations.length > 0 && (
            <div className="mt-4">
              <strong>Recommendations:</strong>
              <ul className="list-disc list-inside mt-2">
                {diagnostics.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-600">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Geolocation Tests</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => runTest('smartLocation', () => getSmartLocation(getMobileGeolocationOptions()))}
              disabled={loading === 'smartLocation'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'smartLocation' ? 'Testing...' : 'Test Smart Location'}
            </button>
            
            <button
              onClick={() => runTest('gpsLocation', () => getCurrentLocationGPS(getMobileGeolocationOptions()))}
              disabled={loading === 'gpsLocation'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading === 'gpsLocation' ? 'Testing...' : 'Test GPS Only'}
            </button>
            
            <button
              onClick={() => runTest('ipLocation', () => getLocationFromIP())}
              disabled={loading === 'ipLocation'}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading === 'ipLocation' ? 'Testing...' : 'Test IP Only'}
            </button>
            
            <button
              onClick={() => {
                setResults({});
                setLoading(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-4">
              {Object.entries(results).map(([testName, result]) => (
                <div key={testName} className="border rounded p-4">
                  <h3 className="font-semibold text-lg mb-2">{testName}</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
