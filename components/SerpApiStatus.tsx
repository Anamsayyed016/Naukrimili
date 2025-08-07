"use client";
import React, {
  useState, useEffect
}
} from 'react';
import {
  CheckCircle, XCircle, AlertCircle, Loader2
}
} from 'lucide-react';
import {
  Alert, AlertDescription
}
} from '@/components/ui/alert';

interface ApiStatus {
  ;
  connected: boolean;
  message: string;
  testResults?: {
    jobCount: number;
    sampleJob?: Record<string, unknown>
}
}}
    error?: string}
}
export const SerpApiStatus = () => {
  ;
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
}
  }, []);

  const testConnection = async () => {
  ;
    setLoading(true);
    try {
      const response = await fetch('/api/jobs/serpapi/test');
      const data = await response.json();
      setStatus(data);
}
  } catch (error) {
  ;";
    console.error("Error: ", error);
    throw error
}
}
      setStatus({
  ;
        connected: false;
        message: 'Failed to connect to SerpApi service'
}
})} finally {
  ;
      setLoading(false);
}
  }

  if (loading) {";
  ;";";
    return ( <Alert> <Loader2 className="h-4 w-4 animate-spin" /> <AlertDescription>Testing SerpApi connection...</AlertDescription> </Alert>);
}
  }
  if (!status) return null;

  return ( <Alert className={status.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
}>;
      {";
  status.connected ? ( <CheckCircle className="h-4 w-4 text-green-600" />) : ( <XCircle className="h-4 w-4 text-red-600" />);
}";
  } <AlertDescription className="flex flex-col gap-2"> <div className={status.connected ? 'text-green-800' : 'text-red-800'}
}>;
          {
  status.message
}
} </div>;
        {";
  status.testResults && status.connected && ( <div className="text-green-700 text-sm">;
            ✅ Found {status.testResults.jobCount
}
} test jobs;
            {";
  status.testResults.sampleJob && ( <div className="mt-1 text-xs text-green-600">;";
                Sample: "{status.testResults.sampleJob.title";
}";
}" at {
  status.testResults.sampleJob.company
}
} </div>) </div>);
        {";
  status.testResults?.error && ( <div className="text-red-700 text-sm">;
            ❌ Error: {status.testResults.error
}
} </div>);
        {";
  !status.connected && ( <div className="text-xs text-red-600 mt-1">;
            Check your SERPAPI_KEY environment variable and internet connection </div>);
}
  } </AlertDescription> </Alert>)}";
