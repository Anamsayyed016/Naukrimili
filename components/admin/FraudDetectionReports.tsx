"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Eye, 
  Ban, 
  CheckCircle,
  Users,
  FileText,
  TrendingUp
} from 'lucide-react';

interface FraudAlert {
  id: string;
  type: 'fake_job' | 'suspicious_employer' | 'duplicate_profile' | 'payment_fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityId: string;
  entityType: 'job' | 'employer' | 'candidate' | 'payment';
  reportedBy: string;
  reportedAt: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  metadata: Record<string, unknown>;
}

interface FraudStats {
  totalReports: number;
  pendingReports: number;
  resolvedToday: number;
  criticalAlerts: number;
  topFraudTypes: Array<{ type: string; count: number }>;
}

const FraudDetectionReports: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'critical'>('all');

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual API
      const mockAlerts: FraudAlert[] = [
        {
          id: 'fraud-001',
          type: 'fake_job',
          severity: 'critical',
          title: 'Suspicious Job Posting - High Salary Claim',
          description: 'Job posting offers unrealistic salary (₹50L for entry level) with minimal requirements',
          entityId: 'job-12345',
          entityType: 'job',
          reportedBy: 'auto-detection',
          reportedAt: new Date().toISOString(),
          status: 'pending',
          metadata: {
            salaryOffered: 5000000,
            experienceRequired: 0,
            companyAge: 1,
            similarReports: 3
          }
        },
        {
          id: 'fraud-002',
          type: 'suspicious_employer',
          severity: 'high',
          title: 'Employer Account - Multiple Red Flags',
          description: 'New employer account with generic company details and requesting upfront payments',
          entityId: 'emp-67890',
          entityType: 'employer',
          reportedBy: 'user-reports',
          reportedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'investigating',
          metadata: {
            accountAge: 2,
            jobsPosted: 15,
            userReports: 5,
            paymentRequests: true
          }
        },
        {
          id: 'fraud-003',
          type: 'duplicate_profile',
          severity: 'medium',
          title: 'Potential Duplicate Candidate Profiles',
          description: 'Same phone number and email pattern across multiple candidate accounts',
          entityId: 'candidate-group-1',
          entityType: 'candidate',
          reportedBy: 'auto-detection',
          reportedAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'pending',
          metadata: {
            duplicateCount: 4,
            sharedData: ['phone', 'email_pattern'],
            confidenceScore: 0.85
          }
        }
      ];

      const mockStats: FraudStats = {
        totalReports: 156,
        pendingReports: 23,
        resolvedToday: 8,
        criticalAlerts: 3,
        topFraudTypes: [
          { type: 'fake_job', count: 45 },
          { type: 'suspicious_employer', count: 38 },
          { type: 'duplicate_profile', count: 28 },
          { type: 'payment_fraud', count: 15 }
        ]
      };

      setAlerts(mockAlerts);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading fraud data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: 'investigate' | 'resolve' | 'dismiss'): Promise<void> => {
    try {
      // Update alert status
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: action === 'investigate' ? 'investigating' : action === 'resolve' ? 'resolved' : 'dismissed' }
          : alert
      ));

      // Simulate API call
      console.log(`Action ${action} performed on alert ${alertId}`);
    } catch (error) {
      console.error('Error performing alert action:', error);
    }
  };

  const getSeverityColor = (severity: FraudAlert['severity']): string => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity];
  };

  const getTypeIcon = (type: FraudAlert['type']) => {
    const icons = {
      fake_job: FileText,
      suspicious_employer: Users,
      duplicate_profile: Users,
      payment_fraud: AlertTriangle
    };
    const IconComponent = icons[type];
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'pending') return alert.status === 'pending';
    if (filter === 'critical') return alert.severity === 'critical';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Detection Reports</h1>
          <p className="text-gray-600">Monitor and manage fraud alerts and security incidents</p>
        </div>
        <Button onClick={loadFraudData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.totalReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold">{stats.resolvedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Ban className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Critical Alerts</p>
                  <p className="text-2xl font-bold">{stats.criticalAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {(['all', 'pending', 'critical'] as const).map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? "default" : "outline"}
            onClick={() => setFilter(filterType)}
            className="capitalize"
          >
            {filterType}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No fraud alerts</h3>
              <p className="text-gray-600">All reports have been reviewed and resolved.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getTypeIcon(alert.type)}
                      <h3 className="text-lg font-semibold">{alert.title}</h3>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {alert.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{alert.description}</p>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Reported by: {alert.reportedBy}</p>
                      <p>Entity: {alert.entityType} ({alert.entityId})</p>
                      <p>Reported: {new Date(alert.reportedAt).toLocaleString()}</p>
                    </div>

                    {/* Metadata */}
                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Additional Information:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(alert.metadata).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {alert.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAlertAction(alert.id, 'investigate')}
                        >
                          Investigate
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAlertAction(alert.id, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Fraud Types Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Fraud Types Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topFraudTypes.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="font-medium capitalize">{item.type.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.count / stats.totalReports) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Alert Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAlert(null)}
                className="absolute top-4 right-4"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedAlert.title}</h3>
                  <p className="text-gray-600">{selectedAlert.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {selectedAlert.type}
                  </div>
                  <div>
                    <span className="font-medium">Severity:</span> {selectedAlert.severity}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedAlert.status}
                  </div>
                  <div>
                    <span className="font-medium">Reported:</span> {new Date(selectedAlert.reportedAt).toLocaleString()}
                  </div>
                </div>

                {selectedAlert.metadata && (
                  <div>
                    <h4 className="font-medium mb-2">Metadata:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(selectedAlert.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FraudDetectionReports;
