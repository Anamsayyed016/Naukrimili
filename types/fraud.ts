export interface FraudReport {
  id: string;
  applicantId: string;
  reporterId: string;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high';
  signals: string[];
  notes?: string;
  resolution?: {
    action: string;
    date: string;
    by: string;
    comments: string;
  };
}

export interface FraudDetectionRule {
  id: string;
  name: string;
  description: string;
  type: 'behavior' | 'document' | 'identity' | 'activity';
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
  conditions: {
    field: string;
    operator: string;
    value: any;
  }[];
  actions: {
    type: 'flag' | 'block' | 'notify';
    config: any;
  }[];
}

export interface FraudMetrics {
  totalReports: number;
  activeInvestigations: number;
  resolvedCases: number;
  riskScore: number;
  recentSignals: {
    type: string;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
}

export interface FraudAlertConfig {
  applicantId: string;
  applicantName?: string;
  suspicious_signals?: string[];
  severity?: 'low' | 'medium' | 'high';
  autoBlock?: boolean;
  notifyAdmin?: boolean;
}
