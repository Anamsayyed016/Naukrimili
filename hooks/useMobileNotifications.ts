/**
 * Mobile Notification Hook
 * Handles mobile-specific notification behavior and optimizations
 */

import { useEffect, useState, useCallback } from 'react';
import { showNotification, checkNotificationCapabilities } from '@/lib/mobile-notifications';

interface MobileNotificationState {
  isMobile: boolean;
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied';
  canRequest: boolean;
  isConnected: boolean;
}

export function useMobileNotifications() {
  const [state, setState] = useState<MobileNotificationState>({
    isMobile: false,
    isSupported: false,
    permission: 'denied',
    canRequest: false,
    isConnected: false
  });

  // Check mobile device and notification capabilities
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkCapabilities = () => {
      const capabilities = checkNotificationCapabilities();
      const isMobile = window.innerWidth <= 768 || 
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      setState({
        isMobile,
        isSupported: capabilities.supported,
        permission: capabilities.permission,
        canRequest: capabilities.canRequest,
        isConnected: true
      });
    };

    checkCapabilities();

    // Listen for resize events to update mobile state
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setState(prev => ({ ...prev, isMobile }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show notification with mobile optimizations
  const showMobileNotification = useCallback((options: {
    title: string;
    body?: string;
    icon?: string;
    tag?: string;
  }) => {
    if (!state.isConnected) {
      console.warn('Mobile notifications not connected');
      return false;
    }

    // Add mobile-specific optimizations
    const mobileOptions = {
      ...options,
      requireInteraction: state.isMobile ? false : undefined,
      silent: state.isMobile ? true : false
    };

    return showNotification(mobileOptions);
  }, [state.isConnected, state.isMobile]);

  // Test notification functionality
  const testNotification = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('Notifications not supported on this device');
      return false;
    }

    return showMobileNotification({
      title: 'Test Notification',
      body: state.isMobile ? 'Mobile notification test' : 'Desktop notification test',
      tag: 'test-notification'
    });
  }, [state.isSupported, state.isMobile, showMobileNotification]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!state.canRequest) {
      console.warn('Cannot request notification permission');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ 
        ...prev, 
        permission: permission as 'default' | 'granted' | 'denied',
        canRequest: permission === 'default'
      }));
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [state.canRequest]);

  // Show welcome notification for new users
  const showWelcomeNotification = useCallback((userName: string) => {
    return showMobileNotification({
      title: `Welcome to NaukriMili, ${userName}!`,
      body: state.isMobile 
        ? 'Start exploring jobs and opportunities' 
        : 'Welcome! Start exploring jobs and opportunities on our platform',
      tag: 'welcome-notification'
    });
  }, [showMobileNotification, state.isMobile]);

  // Show job application notification
  const showJobApplicationNotification = useCallback((jobTitle: string, companyName: string) => {
    return showMobileNotification({
      title: 'Application Submitted!',
      body: state.isMobile 
        ? `${jobTitle} at ${companyName}` 
        : `Your application for ${jobTitle} at ${companyName} has been submitted successfully`,
      tag: 'job-application-notification'
    });
  }, [showMobileNotification, state.isMobile]);

  // Show new message notification
  const showNewMessageNotification = useCallback((senderName: string, message: string) => {
    return showMobileNotification({
      title: `New message from ${senderName}`,
      body: state.isMobile 
        ? message.substring(0, 50) + (message.length > 50 ? '...' : '')
        : message,
      tag: 'new-message-notification'
    });
  }, [showMobileNotification, state.isMobile]);

  // Show job recommendation notification
  const showJobRecommendationNotification = useCallback((jobTitle: string, companyName: string) => {
    return showMobileNotification({
      title: 'New Job Recommendation',
      body: state.isMobile 
        ? `${jobTitle} at ${companyName}` 
        : `We found a great match: ${jobTitle} at ${companyName}`,
      tag: 'job-recommendation-notification'
    });
  }, [showMobileNotification, state.isMobile]);

  return {
    ...state,
    showMobileNotification,
    testNotification,
    requestPermission,
    showWelcomeNotification,
    showJobApplicationNotification,
    showNewMessageNotification,
    showJobRecommendationNotification
  };
}
