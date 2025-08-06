// Enhanced User Activity Tracking Service
export interface UserInteraction {
  type: 'search' | 'category_view' | 'job_view' | 'location_search' | 'filter_use';
  value: string;
  timestamp: Date;
  metadata?: Record<string, any>}

export interface TrendingMetrics {
  category: string;
  searches: number;
  views: number;
  applications?: number;
  growth: number;
  userRelevance: number}

class UserActivityService {
  private interactions: UserInteraction[] = [];
  private readonly STORAGE_KEY = 'job_portal_user_activity';
  private readonly MAX_INTERACTIONS = 500;

  constructor() {
    this.loadFromStorage()}

  // Track user interaction
  track(interaction: Omit<UserInteraction, 'timestamp'>) {
    const newInteraction: UserInteraction = {
      ...interaction,
      timestamp: new Date()
    };

    this.interactions.unshift(newInteraction);
    
    // Keep only recent interactions
    if (this.interactions.length > this.MAX_INTERACTIONS) {
      this.interactions = this.interactions.slice(0, this.MAX_INTERACTIONS)}

    this.saveToStorage()}

  // Get trending categories based on user activity
  getTrendingCategories(baseCategories: Record<string, unknown>[]): TrendingMetrics[] {
    const categoryMetrics = new Map<string, TrendingMetrics>();
    
    // Initialize with base categories
    baseCategories.forEach((cat, index) => {
      // Use deterministic growth based on category index to avoid hydration issues
      const deterministicGrowth = ((index * 7) % 30) - 10; // -10 to +19 range
      
      categoryMetrics.set(cat.name, {
        category: cat.name,
        searches: 0,
        views: 0,
        growth: deterministicGrowth,
        userRelevance: 0
  })});

    // Calculate user activity impact
    const recentInteractions = this.getRecentInteractions(7); // Last 7 days
    
    recentInteractions.forEach(interaction => {
      if (interaction.type === 'search' || interaction.type === 'category_view') {
        // Find matching category
        baseCategories.forEach(cat => {
          if (interaction.value.toLowerCase().includes(cat.name.toLowerCase())) {
            const metrics = categoryMetrics.get(cat.name);
            if (metrics) {
              if (interaction.type === 'search') metrics.searches++;
              if (interaction.type === 'category_view') metrics.views++;
              metrics.userRelevance += 1}
          }
  })}
  });

    // Calculate final trending scores
    return Array.from(categoryMetrics.values()).map(metric => ({
      ...metric,
      growth: metric.growth + (metric.userRelevance * 5), // User activity boosts growth
  })).sort((a, b) => b.growth - a.growth)}

  // Get personalized job recommendations
  getPersonalizedFilters() {
    const recentInteractions = this.getRecentInteractions(30); // Last 30 days
    
    const locationFreq = new Map<string, number>();
    const categoryFreq = new Map<string, number>();
    const experienceFreq = new Map<string, number>();

    recentInteractions.forEach(interaction => {
      switch (interaction.type) {
        case 'location_search':
          locationFreq.set(interaction.value, (locationFreq.get(interaction.value) || 0) + 1);
          break;
        case 'category_view':
          categoryFreq.set(interaction.value, (categoryFreq.get(interaction.value) || 0) + 1);
          break;
        case 'filter_use':
          if (interaction.metadata?.filterType === 'experience') {
            experienceFreq.set(interaction.value, (experienceFreq.get(interaction.value) || 0) + 1)}
          break}
  });

    return {
      preferredLocations: this.getTopEntries(locationFreq, 3),
      preferredCategories: this.getTopEntries(categoryFreq, 5),
      preferredExperience: this.getTopEntries(experienceFreq, 2)}}

  // Get user search patterns
  getSearchPatterns() {
    const searchInteractions = this.interactions.filter(i => i.type === 'search');
    const patterns = {
      commonKeywords: this.extractKeywords(searchInteractions),
      searchTimes: this.analyzeSearchTimes(searchInteractions),
      searchFrequency: this.calculateSearchFrequency(searchInteractions)
    };

    return patterns}

  // Get smart suggestions based on user behavior
  getSmartSuggestions() {
    const patterns = this.getSearchPatterns();
    const preferences = this.getPersonalizedFilters();
    
    return {
      suggestedSearches: patterns.commonKeywords.slice(0, 5),
      suggestedLocations: preferences.preferredLocations,
      suggestedCategories: preferences.preferredCategories,
      bestSearchTime: patterns.searchTimes.peak || 'morning'}}

  // Private helper methods
  private getRecentInteractions(days: number): UserInteraction[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.interactions.filter(interaction => 
      interaction.timestamp >= cutoff)}

  private getTopEntries<T>(map: Map<T, number>, limit: number): T[] {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
      .map(entry => entry[0]);
  }

  private extractKeywords(searchInteractions: UserInteraction[]): string[] {
    const keywords = new Map<string, number>();
    
    searchInteractions.forEach(interaction => {
      const words = interaction.value.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) { // Ignore short words
          keywords.set(word, (keywords.get(word) || 0) + 1)}
  })});

    return this.getTopEntries(keywords, 10)}

  private analyzeSearchTimes(searchInteractions: UserInteraction[]) {
    const hourCounts = new Map<number, number>();
    
    searchInteractions.forEach(interaction => {
      const hour = interaction.timestamp.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
  });

    const peakHour = this.getTopEntries(hourCounts, 1)[0];
    let peakPeriod = 'morning';
    
    if (peakHour >= 6 && peakHour < 12) peakPeriod = 'morning';
    else if (peakHour >= 12 && peakHour < 17) peakPeriod = 'afternoon';
    else if (peakHour >= 17 && peakHour < 21) peakPeriod = 'evening';
    else peakPeriod = 'night';

    return { peak: peakPeriod, peakHour }}

  private calculateSearchFrequency(searchInteractions: UserInteraction[]) {
    const recent = this.getRecentInteractions(7);
    return {
      daily: recent.length / 7,
      weekly: recent.length,
      trend: recent.length > this.getRecentInteractions(14).length / 2 ? 'increasing' : 'stable'}}

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.interactions))} catch (error) {
    console.error("Error:", error);
    throw error}
        // console.warn('Failed to save user activity to localStorage:', error)}
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.interactions = parsed.map((item: Record<string, unknown>) => ({
            ...item,
            timestamp: new Date(item.timestamp)
  }))}
      } catch (error) {
    console.error("Error:", error);
    throw error}
        // console.warn('Failed to load user activity from localStorage:', error);
        this.interactions = []}
    }
  }

  // Clean old interactions (call periodically)
  cleanup() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90); // Keep 90 days
    
    this.interactions = this.interactions.filter(
      interaction => interaction.timestamp >= cutoff
    );
    
    this.saveToStorage()}

  // Get activity summary for debugging/analytics
  getActivitySummary() {
    const total = this.interactions.length;
    const byType = new Map<string, number>();
    
    this.interactions.forEach(interaction => {
      byType.set(interaction.type, (byType.get(interaction.type) || 0) + 1)
  });

    return {
      totalInteractions: total,
      byType: Object.fromEntries(byType),
      oldestInteraction: this.interactions[this.interactions.length - 1]?.timestamp,
      newestInteraction: this.interactions[0]?.timestamp}}
}

// Singleton instance
export const userActivityService = new UserActivityService();

// React hook for using the service
export function useUserActivity() {
  const track = (interaction: Omit<UserInteraction, 'timestamp'>) => {
    userActivityService.track(interaction)};

  const getTrendingCategories = (baseCategories: Record<string, unknown>[]) => {
    return userActivityService.getTrendingCategories(baseCategories)};

  const getPersonalizedFilters = () => {
    return userActivityService.getPersonalizedFilters()};

  const getSmartSuggestions = () => {
    return userActivityService.getSmartSuggestions()};

  const getActivitySummary = () => {
    return userActivityService.getActivitySummary()};

  return {
    track,
    getTrendingCategories,
    getPersonalizedFilters,
    getSmartSuggestions,
    getActivitySummary};
}

