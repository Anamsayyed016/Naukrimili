import {
  useState, useEffect
}
} from 'react';


export interface Application {
  id?: number;
  jobId: number | string;
  userId: number | string;
  status: string // Add other fields as needed
}
}
}
export function useApplicationsApi() {
  ;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      setApplications(data);
}
  } catch (err) {
  ;
      setError('Failed to fetch applications');
}
  } finally {
  ;
      setLoading(false);
}
  }

  const createApplication = async (application: Application): Promise<void> => {
  ;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST';
        headers: {
      'Content-Type': 'application/json'
}
});
        body: JSON.stringify(application);
  });
      if (!res.ok) throw new Error('Failed to create');
      await fetchApplications()} catch (err) {
  ;
      setError('Failed to create application');
}
  } finally {
  ;
      setLoading(false);
}
  }

  const updateApplication = async (id: number, application: Application): Promise<void> => {
  ;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id
}
}`, {
  ;
        method: 'PUT';
        headers: {
      'Content-Type': 'application/json'
}
});
        body: JSON.stringify(application);
  });
      if (!res.ok) throw new Error('Failed to update');
      await fetchApplications()} catch (err) {
  ;
      setError('Failed to update application');
}
  } finally {
  ;
      setLoading(false);
}
  }

  const deleteApplication = async (id: number): Promise<void> => {
  ;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id
}
}`, {
  method: 'DELETE'
}
});
      if (!res.ok) throw new Error('Failed to delete');
      await fetchApplications()} catch (err) {
  ;
      setError('Failed to delete application');
}
  } finally {
  ;
      setLoading(false);
}
  }

  useEffect(() => {
  fetchApplications();
}
  }, []);

  return { applications, loading, error, fetchApplications, createApplication, updateApplication, deleteApplication }
}