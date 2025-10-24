/**
 * Geolocation Health Check Script
 * 
 * Comprehensive testing of all geolocation services and configurations
 */

import { getSmartLocation, getMobileGeolocationOptions } from '../lib/mobile-geolocation';
import { detectBrowserLocation } from '../lib/location-service';

interface GeolocationTestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  error?: string;
}

class GeolocationHealthCheck {
  private results: GeolocationTestResult[] = [];

  async runAllTests(): Promise<GeolocationTestResult[]> {
    console.log('🔍 Starting comprehensive geolocation health check...\n');

    // Test 1: Environment variables
    await this.testEnvironmentVariables();

    // Test 2: Browser geolocation support
    await this.testBrowserGeolocationSupport();

    // Test 3: HTTPS requirement
    await this.testHTTPSRequirement();

    // Test 4: Mobile device detection
    await this.testMobileDeviceDetection();

    // Test 5: GPS geolocation (if in browser)
    if (typeof window !== 'undefined') {
      await this.testGPSGeolocation();
    }

    // Test 6: IP-based geolocation
    await this.testIPGeolocation();

    // Test 7: Smart location detection
    if (typeof window !== 'undefined') {
      await this.testSmartLocationDetection();
    }

    // Test 8: Reverse geocoding
    await this.testReverseGeocoding();

    this.printResults();
    return this.results;
  }

  private async testEnvironmentVariables(): Promise<void> {
    console.log('📋 Testing environment variables...');
    
    const requiredVars = [
      'IPSTACK_API_KEY',
      'OPENCAGE_API_KEY',
      'GOOGLE_GEOLOCATION_API_KEY'
    ];

    const missingVars: string[] = [];
    const presentVars: string[] = [];

    for (const varName of requiredVars) {
      if (process.env[varName]) {
        presentVars.push(varName);
      } else {
        missingVars.push(varName);
      }
    }

    if (missingVars.length === 0) {
      this.addResult('Environment Variables', 'success', 'All required environment variables are configured', {
        configured: presentVars
      });
    } else if (presentVars.length > 0) {
      this.addResult('Environment Variables', 'warning', 'Some environment variables are missing', {
        configured: presentVars,
        missing: missingVars
      });
    } else {
      this.addResult('Environment Variables', 'error', 'No geolocation environment variables configured', {
        missing: missingVars
      });
    }
  }

  private async testBrowserGeolocationSupport(): Promise<void> {
    console.log('🌐 Testing browser geolocation support...');
    
    if (typeof window === 'undefined') {
      this.addResult('Browser Geolocation', 'warning', 'Not running in browser environment');
      return;
    }

    if (!navigator.geolocation) {
      this.addResult('Browser Geolocation', 'error', 'Geolocation API not supported by this browser');
      return;
    }

    this.addResult('Browser Geolocation', 'success', 'Geolocation API is supported');
  }

  private async testHTTPSRequirement(): Promise<void> {
    console.log('🔒 Testing HTTPS requirement...');
    
    if (typeof window === 'undefined') {
      this.addResult('HTTPS Requirement', 'warning', 'Not running in browser environment');
      return;
    }

    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isHTTPS || isLocalhost) {
      this.addResult('HTTPS Requirement', 'success', 'HTTPS is available or running on localhost');
    } else if (isMobile) {
      this.addResult('HTTPS Requirement', 'error', 'Mobile device requires HTTPS for geolocation');
    } else {
      this.addResult('HTTPS Requirement', 'warning', 'HTTPS recommended for better geolocation support');
    }
  }

  private async testMobileDeviceDetection(): Promise<void> {
    console.log('📱 Testing mobile device detection...');
    
    if (typeof window === 'undefined') {
      this.addResult('Mobile Detection', 'warning', 'Not running in browser environment');
      return;
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Tablet)/i.test(userAgent);
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    this.addResult('Mobile Detection', 'success', `Device detected: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`, {
      userAgent: userAgent.substring(0, 50) + '...',
      screenSize: `${screenWidth}x${screenHeight}`,
      isMobile,
      isTablet
    });
  }

  private async testGPSGeolocation(): Promise<void> {
    console.log('📍 Testing GPS geolocation...');
    
    try {
      const options = getMobileGeolocationOptions();
      const result = await getSmartLocation(options);
      
      if (result.success) {
        this.addResult('GPS Geolocation', 'success', 'GPS geolocation working', {
          coordinates: result.coordinates,
          city: result.city,
          country: result.country,
          source: result.source
        });
      } else {
        this.addResult('GPS Geolocation', 'error', `GPS geolocation failed: ${result.error}`, {
          error: result.error,
          errorCode: result.errorCode
        });
      }
    } catch (error) {
      this.addResult('GPS Geolocation', 'error', `GPS geolocation error: ${error}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testIPGeolocation(): Promise<void> {
    console.log('🌍 Testing IP-based geolocation...');
    
    try {
      // Test with a known IP (Google DNS)
      const testIP = '8.8.8.8';
      const response = await fetch(`http://ip-api.com/json/${testIP}`);
      
      if (response.ok) {
        const data = await response.json();
        this.addResult('IP Geolocation', 'success', 'IP geolocation working', {
          testIP,
          country: data.country,
          city: data.city,
          region: data.regionName
        });
      } else {
        this.addResult('IP Geolocation', 'error', `IP geolocation failed: ${response.status}`);
      }
    } catch (error) {
      this.addResult('IP Geolocation', 'error', `IP geolocation error: ${error}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testSmartLocationDetection(): Promise<void> {
    console.log('🧠 Testing smart location detection...');
    
    try {
      const options = getMobileGeolocationOptions();
      const result = await getSmartLocation(options);
      
      if (result.success) {
        this.addResult('Smart Location', 'success', 'Smart location detection working', {
          coordinates: result.coordinates,
          city: result.city,
          country: result.country,
          source: result.source
        });
      } else {
        this.addResult('Smart Location', 'error', `Smart location detection failed: ${result.error}`, {
          error: result.error,
          source: result.source
        });
      }
    } catch (error) {
      this.addResult('Smart Location', 'error', `Smart location detection error: ${error}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testReverseGeocoding(): Promise<void> {
    console.log('🗺️ Testing reverse geocoding...');
    
    try {
      // Test with known coordinates (London)
      const lat = 51.5074;
      const lng = -0.1278;
      
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        this.addResult('Reverse Geocoding', 'success', 'Reverse geocoding working', {
          coordinates: `${lat}, ${lng}`,
          city: data.city,
          country: data.countryName
        });
      } else {
        this.addResult('Reverse Geocoding', 'error', `Reverse geocoding failed: ${response.status}`);
      }
    } catch (error) {
      this.addResult('Reverse Geocoding', 'error', `Reverse geocoding error: ${error}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private addResult(service: string, status: 'success' | 'error' | 'warning', message: string, data?: any): void {
    this.results.push({
      service,
      status,
      message,
      data,
      error: status === 'error' ? message : undefined
    });
  }

  private printResults(): void {
    console.log('\n📊 Geolocation Health Check Results:');
    console.log('=====================================\n');

    const successCount = this.results.filter(r => r.status === 'success').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;

    console.log(`✅ Success: ${successCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`❌ Errors: ${errorCount}\n`);

    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.service}: ${result.message}`);
      
      if (result.data) {
        console.log(`   Data:`, JSON.stringify(result.data, null, 2));
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      console.log('');
    });

    // Overall status
    if (errorCount === 0) {
      console.log('🎉 Geolocation system is working properly!');
    } else if (errorCount <= 2) {
      console.log('⚠️ Geolocation system has some issues but should work with fallbacks.');
    } else {
      console.log('❌ Geolocation system has significant issues and may not work properly.');
    }
  }
}

// Run the health check if called directly
if (typeof window !== 'undefined') {
  // Browser environment
  const healthCheck = new GeolocationHealthCheck();
  healthCheck.runAllTests();
} else {
  // Node.js environment
  console.log('Geolocation health check requires browser environment for full testing.');
  console.log('Run this script in a browser or use the web interface.');
}

export { GeolocationHealthCheck };
