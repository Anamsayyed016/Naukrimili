import { useState, useEffect, useCallback } from 'react';

export interface AdData { id: string; title: string; description?: string; image_url?: string; click_url: string; ad_type?: string; relevance_score?: number }
export interface UserData { user_id: string; industry?: string; location?: string; skills?: string[] }
interface AdsResponse { ads: AdData[]; user_segment?: string; total_available?: number }
interface TrackEvent { ad_id: string; event_type: 'impression' | 'click' | 'conversion'; user_id?: string; conversion_value?: number }

export function useAdsApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async (userData: UserData, numAds = 3, context?: string) => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams();
      p.append('user_id', userData.user_id);
      p.append('num_ads', String(numAds));
      if (context) p.append('context', context);
      if (userData.industry) p.append('industry', userData.industry);
      if (userData.location) p.append('location', userData.location);
      if (userData.skills?.length) p.append('skills', userData.skills.join(','));
      const res = await fetch(`/api/ads?${p.toString()}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      return (data.data || data) as AdsResponse;
    } catch (_) { setError('Failed to fetch ads'); return null; } finally { setLoading(false); }
  }, []);

  const trackAdEvent = useCallback(async (evt: TrackEvent) => {
    try {
      const res = await fetch('/api/ads/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evt) });
      return res.ok;
    } catch { return false; }
  }, []);

  const trackImpression = useCallback((adId: string, userId?: string) => trackAdEvent({ ad_id: adId, event_type: 'impression', user_id: userId }), [trackAdEvent]);
  const trackClick = useCallback((adId: string, userId?: string) => trackAdEvent({ ad_id: adId, event_type: 'click', user_id: userId }), [trackAdEvent]);
  const trackConversion = useCallback((adId: string, userId?: string, value?: number) => trackAdEvent({ ad_id: adId, event_type: 'conversion', user_id: userId, conversion_value: value }), [trackAdEvent]);

  return { loading, error, fetchAds, trackAdEvent, trackImpression, trackClick, trackConversion };
}

export function usePersonalizedAds(userData: UserData, numAds = 3, context?: string) {
  const { loading, error, fetchAds, trackImpression } = useAdsApi();
  const [ads, setAds] = useState<AdData[]>([]);
  const [segment, setSegment] = useState<string>('');
  useEffect(() => {
    if (!userData.user_id) return;
    let cancelled = false;
    (async () => {
      const res = await fetchAds(userData, numAds, context);
      if (!cancelled && res) {
        setAds(res.ads);
        setSegment(res.user_segment || 'general');
        res.ads.forEach(a => trackImpression(a.id, userData.user_id));
      }
    })();
    return () => { cancelled = true; };
  }, [userData.user_id, userData.industry, userData.location, numAds, context, fetchAds, trackImpression]);
  return { ads, userSegment: segment, loading, error };
}

export function useAdClick() {
  const { trackClick } = useAdsApi();
  const handleAdClick = useCallback(async (ad: AdData, userId?: string) => {
    trackClick(ad.id, userId);
    if (ad.click_url.startsWith('http')) window.open(ad.click_url, '_blank', 'noopener,noreferrer');
    else window.location.href = ad.click_url;
  }, [trackClick]);
  return { handleAdClick };
}

export function useContextualAds(context: string, userData: UserData) {
  const { fetchAds, trackImpression } = useAdsApi();
  const [ads, setAds] = useState<AdData[]>([]);
  useEffect(() => {
    if (!context || !userData.user_id) return;
    let cancelled = false;
    (async () => {
      const res = await fetchAds(userData, 2, context);
      if (!cancelled && res) {
        setAds(res.ads);
        res.ads.forEach(a => trackImpression(a.id, userData.user_id));
      }
    })();
    return () => { cancelled = true; };
  }, [context, userData.user_id, fetchAds, trackImpression]);
  return { contextualAds: ads };
}