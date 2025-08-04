'use client';

import { useState, useEffect } from 'react';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: string;
  version: string;
  environment: string;
  apis: {
    jobs: boolean;
    companies: boolean;
  };
  database: string;
  server: {
    platform: string;
    nodeVersion: string;
    memory: {
      used: string;
      total: string;
    };
  };
}

interface ApiTest {
  name: string;
  url: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
}

export default function DiagnosticPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [apiTests, setApiTests] = useState<ApiTest[]>([
    { name: 'Health Check', url: '/api/health', status: 'pending' },
    { name: 'Jobs API', url: '/api/jobs?limit=1', status: 'pending' },
    { name: 'Companies API', url: '/api/companies?limit=1', status: 'pending' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    
    const updatedTests = [...apiTests];
    
    for (let i = 0; i < updatedTests.length; i++) {
      const test = updatedTests[i];
      try {
        const response = await fetch(test.url);
        const data = await response.json();
        
        if (response.ok) {
          test.status = 'success';
          test.response = data;
          
          if (test.name === 'Health Check') {
            setHealthData(data);
          }
        } else {
          test.status = 'error';
          test.error = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        test.status = 'error';
        test.error = error instanceof Error ? error.message : 'Unknown error';
      }
      
      setApiTests([...updatedTests]);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">System Diagnostics</h1>
          <p className="text-gray-600">Monitor server health and API functionality</p>
        </div>

        <div className="mb-8">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Running Tests...' : '🔄 Refresh Diagnostics'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🖥️ Server Health</h2>
            
            {healthData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    healthData.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {healthData.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Environment:</span>
                  <span className="text-gray-600">{healthData.environment}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Uptime:</span>
                  <span className="text-gray-600">{healthData.uptime}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Memory:</span>
                  <span className="text-gray-600">{healthData.server.memory.used} / {healthData.server.memory.total}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading server health data...</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔌 API Tests</h2>
            
            <div className="space-y-4">
              {apiTests.map((test, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-800">{test.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(test.status)}`}>
                      {getStatusIcon(test.status)} {test.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-2">{test.url}</p>
                  
                  {test.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                      <p className="text-red-700 text-sm font-medium">Error:</p>
                      <p className="text-red-600 text-sm">{test.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">🔗 Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">🏠 Homepage</a>
            <a href="/jobs" className="text-blue-600 hover:text-blue-800 font-medium">💼 Jobs</a>
            <a href="/companies" className="text-blue-600 hover:text-blue-800 font-medium">🏢 Companies</a>
            <a href="/api/health" className="text-blue-600 hover:text-blue-800 font-medium">🔍 Health API</a>
          </div>
        </div>
      </div>
    </div>
  );
}