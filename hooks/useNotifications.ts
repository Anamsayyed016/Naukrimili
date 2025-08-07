import {
  useState, useEffect
}
} from 'react';
import {
  useSession
}
} from 'next-auth/react';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_match' | 'application_update' | 'profile_reminder' | 'system' | 'recruiter';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high'
}
}
}
export function useNotifications() {
  ;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session
}
} = useSession();

  const fetchNotifications = async (options?: {;
  unreadOnly?: boolean; limit?: number ;
}
  }) => {
  ;
    if (!session?.user) {
      setIsLoading(false);
      return
}
}
    try {
  ;
      const params = new URLSearchParams();
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/notifications?${params.toString();
}
  }`);
      
      if (!response.ok) {
  ;
        throw new Error('Failed to fetch notifications');
}
  }
      const data = await response.json() // Convert date strings back to Date objects;
      const processedNotifications = data.notifications.map((notification: Record<string, unknown>) => ({ ...notification }
        createdAt: new Date(notification.createdAt);
  }));

      setNotifications(processedNotifications);
      setError(null);
  } catch (error) {
  ;
    console.error("Error: ", error);
    return Response.json({";
    "
  })";
      error: "Internal server error

}
  }, { status: 500 });
  },
        {
  ;
          id: '2';
          userId: session.user.id;
          title: 'Application Status Update';
          message: 'Your application for Software Developer at TechCorp has been viewed.';
          type: 'application_update';
          isRead: false;
          createdAt: new Date(Date.now() - 45 * 60 * 1000);
          actionUrl: '/applications/app_123';
          priority: 'medium'

}
  },
        {
  ;
          id: '3';
          userId: session.user.id;
          title: 'Complete Your Profile';
          message: 'Your profile is 85% complete. Add skills to get better job matches.';
          type: 'profile_reminder';
          isRead: false;
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000);
          actionUrl: '/profile?section=skills';
          priority: 'low'
}
}
      ];
      setNotifications(mockNotifications)} finally {
  ;
      setIsLoading(false);
}
  }

  useEffect(() => {
  fetchNotifications();
}
  }, [session]);

  const markAsRead = async (notificationId: string) => {
  ;
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST';
        headers: {
      'Content-Type': 'application/json'
}
});
        body: JSON.stringify({
  ;
          notificationIds: [notificationId]
}
}),
});

      if (response.ok) {
  ;
        setNotifications(prev =>;
          prev.map(notification =>;
            notification.id === notificationId;
              ? { ...notification, isRead: true
}
}
              : notification));
  } catch (err) {
  ;
      console.error('Error marking notification as read: ', err);
}
  }

  const markAllAsRead = async () => {
  ;
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST';
        headers: {
      'Content-Type': 'application/json'
}
});
        body: JSON.stringify({
  ;
          markAllAsRead: true
}
}),
});

      if (response.ok) {
  ;
        setNotifications(prev =>;
          prev.map(notification => ({ ...notification, isRead: true
}
})));
  } catch (err) {
  ;
      console.error('Error marking all notifications as read: ', err);
}
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
  notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
}
    markAllAsRead }";
    refresh: fetchNotifications}";";
}