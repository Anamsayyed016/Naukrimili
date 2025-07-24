"""
Advanced Advertisement Engine for Job Portal
Provides intelligent ad targeting, user segmentation, and performance analytics
"""

import random
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
from collections import defaultdict

class UserSegment(Enum):
    JOB_SEEKER = "job_seeker"
    EMPLOYER = "employer"
    STUDENT = "student"
    RECRUITER = "recruiter"
    CAREER_CHANGER = "career_changer"
    PASSIVE_CANDIDATE = "passive_candidate"

class AdType(Enum):
    JOB_LISTING = "job_listing"
    COURSE_PROMOTION = "course_promotion"
    RECRUITMENT_TOOL = "recruitment_tool"
    CAREER_SERVICE = "career_service"
    RESUME_BUILDER = "resume_builder"
    SPONSORED_COMPANY = "sponsored_company"
    BANNER = "banner"
    VIDEO = "video"

@dataclass
class Ad:
    id: str
    title: str
    description: str
    image_url: str
    click_url: str
    ad_type: AdType
    target_segments: List[UserSegment]
    budget: float
    daily_budget: float
    cpc: float  # Cost per click
    cpm: float  # Cost per mille (1000 impressions)
    start_date: datetime
    end_date: datetime
    keywords: List[str]
    industry: Optional[str] = None
    location: Optional[str] = None
    company_id: Optional[str] = None
    priority: int = 1
    is_active: bool = True
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: float = 0.0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

@dataclass
class UserProfile:
    user_id: str
    segment: UserSegment
    industry: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    skills: List[str] = None
    recent_searches: List[str] = None
    page_views: List[str] = None
    last_active: datetime = None
    conversion_history: List[str] = None
    preferred_job_types: List[str] = None
    salary_range: Optional[Tuple[int, int]] = None

    def __post_init__(self):
        if self.skills is None:
            self.skills = []
        if self.recent_searches is None:
            self.recent_searches = []
        if self.page_views is None:
            self.page_views = []
        if self.conversion_history is None:
            self.conversion_history = []
        if self.preferred_job_types is None:
            self.preferred_job_types = []
        if self.last_active is None:
            self.last_active = datetime.utcnow()

class AdEngine:
    def __init__(self):
        # User segmentation weights for classification
        self.segment_weights = {
            UserSegment.JOB_SEEKER: {
                'job_applications': 0.4,
                'resume_uploads': 0.3,
                'job_searches': 0.2,
                'profile_completeness': 0.1
            },
            UserSegment.EMPLOYER: {
                'job_postings': 0.4,
                'candidate_searches': 0.3,
                'company_profile_views': 0.2,
                'recruitment_tool_usage': 0.1
            },
            UserSegment.STUDENT: {
                'education_level': 0.3,
                'internship_searches': 0.3,
                'career_resource_views': 0.2,
                'entry_level_applications': 0.2
            },
            UserSegment.RECRUITER: {
                'candidate_contacts': 0.4,
                'ats_usage': 0.3,
                'talent_pool_searches': 0.2,
                'recruitment_events': 0.1
            }
        }
        
        # Initialize with mock ads
        self.ads = self._initialize_mock_ads()
        self.user_profiles = {}
        self.ad_performance_history = defaultdict(list)
        
    def _initialize_mock_ads(self) -> List[Ad]:
        """Initialize the system with sample advertisements"""
        return [
            Ad(
                id="ad_001",
                title="Senior Software Engineer - Remote",
                description="Join our tech team! Competitive salary, great benefits, work from anywhere.",
                image_url="/ads/tech-job.jpg",
                click_url="/jobs/senior-software-engineer-remote",
                ad_type=AdType.JOB_LISTING,
                target_segments=[UserSegment.JOB_SEEKER, UserSegment.PASSIVE_CANDIDATE],
                budget=5000.0,
                daily_budget=200.0,
                cpc=2.50,
                cpm=15.0,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30),
                keywords=["python", "react", "remote", "senior", "engineer"],
                industry="Technology",
                location="Remote",
                company_id="tech_corp_001"
            ),
            Ad(
                id="ad_002",
                title="Master Your Skills with TechLearn Pro",
                description="Advanced courses in AI, Data Science, and Web Development. Get certified!",
                image_url="/ads/online-course.jpg",
                click_url="/courses/techlearn-pro",
                ad_type=AdType.COURSE_PROMOTION,
                target_segments=[UserSegment.STUDENT, UserSegment.CAREER_CHANGER, UserSegment.JOB_SEEKER],
                budget=3000.0,
                daily_budget=100.0,
                cpc=1.80,
                cpm=12.0,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=45),
                keywords=["course", "learning", "certification", "ai", "data science"],
                industry="Education"
            ),
            Ad(
                id="ad_003",
                title="RecruitMaster - ATS Solution",
                description="Streamline your hiring process with our advanced ATS. Free 30-day trial!",
                image_url="/ads/ats-tool.jpg",
                click_url="/tools/recruitmaster",
                ad_type=AdType.RECRUITMENT_TOOL,
                target_segments=[UserSegment.EMPLOYER, UserSegment.RECRUITER],
                budget=8000.0,
                daily_budget=300.0,
                cpc=5.0,
                cpm=25.0,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=60),
                keywords=["ats", "recruitment", "hiring", "hr", "applicant tracking"],
                industry="HR Technology"
            ),
            Ad(
                id="ad_004",
                title="Professional Resume Builder",
                description="Create stunning resumes in minutes. ATS-optimized templates included!",
                image_url="/ads/resume-builder.jpg",
                click_url="/tools/resume-builder",
                ad_type=AdType.RESUME_BUILDER,
                target_segments=[UserSegment.JOB_SEEKER, UserSegment.STUDENT, UserSegment.CAREER_CHANGER],
                budget=2500.0,
                daily_budget=80.0,
                cpc=1.20,
                cpm=8.0,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=90),
                keywords=["resume", "cv", "template", "ats", "professional"],
                industry="Career Services"
            )
        ]

    def classify_user(self, user_data: Dict) -> UserProfile:
        """
        Advanced user classification using behavioral data and ML-style scoring
        """
        # Extract features from user data
        features = self._extract_user_features(user_data)
        
        # Calculate segment probabilities
        segment_scores = {}
        for segment in UserSegment:
            if segment in self.segment_weights:
                score = self._calculate_segment_score(features, segment)
                segment_scores[segment] = score
        
        # Determine primary segment
        primary_segment = max(segment_scores, key=segment_scores.get) if segment_scores else UserSegment.JOB_SEEKER
        
        # Create user profile
        profile = UserProfile(
            user_id=user_data.get('user_id', 'anonymous'),
            segment=primary_segment,
            industry=user_data.get('industry'),
            location=user_data.get('location'),
            experience_level=user_data.get('experience_level'),
            skills=user_data.get('skills', []),
            recent_searches=user_data.get('recent_searches', []),
            page_views=user_data.get('page_views', []),
            preferred_job_types=user_data.get('preferred_job_types', []),
            salary_range=user_data.get('salary_range')
        )
        
        # Cache user profile
        self.user_profiles[profile.user_id] = profile
        
        return profile

    def _extract_user_features(self, user_data: Dict) -> Dict:
        """Extract relevant features for user classification"""
        return {
            'job_applications': len(user_data.get('job_applications', [])),
            'resume_uploads': len(user_data.get('resume_uploads', [])),
            'job_searches': len(user_data.get('job_searches', [])),
            'profile_completeness': user_data.get('profile_completeness', 0),
            'job_postings': len(user_data.get('job_postings', [])),
            'candidate_searches': len(user_data.get('candidate_searches', [])),
            'company_profile_views': len(user_data.get('company_profile_views', [])),
            'recruitment_tool_usage': user_data.get('recruitment_tool_usage', 0),
            'education_level': 1 if user_data.get('is_student') else 0,
            'internship_searches': len([s for s in user_data.get('job_searches', []) if 'intern' in s.lower()]),
            'career_resource_views': len(user_data.get('career_resource_views', [])),
            'entry_level_applications': len([a for a in user_data.get('job_applications', []) if 'entry' in str(a).lower()]),
            'candidate_contacts': len(user_data.get('candidate_contacts', [])),
            'ats_usage': user_data.get('ats_usage', 0),
            'talent_pool_searches': len(user_data.get('talent_pool_searches', [])),
            'recruitment_events': len(user_data.get('recruitment_events', []))
        }

    def _calculate_segment_score(self, features: Dict, segment: UserSegment) -> float:
        """Calculate probability score for a user segment"""
        if segment not in self.segment_weights:
            return 0.0
        
        weights = self.segment_weights[segment]
        score = 0.0
        
        for feature, weight in weights.items():
            feature_value = features.get(feature, 0)
            # Normalize feature values (simple approach)
            normalized_value = min(feature_value / 10.0, 1.0) if feature_value > 0 else 0
            score += normalized_value * weight
        
        return score

    def select_ads(self, user_data: Dict, num_ads: int = 3, context: Dict = None) -> List[Dict]:
        """
        Select the most relevant ads for a user with advanced targeting
        """
        user_profile = self.classify_user(user_data)
        current_time = datetime.utcnow()
        
        # Filter active ads
        active_ads = [ad for ad in self.ads if self._is_ad_active(ad, current_time)]
        
        if not active_ads:
            return []
        
        # Score ads based on relevance
        scored_ads = []
        for ad in active_ads:
            relevance_score = self._calculate_ad_relevance(ad, user_profile, context)
            if relevance_score > 0:
                scored_ads.append((ad, relevance_score))
        
        # Sort by relevance score and budget considerations
        scored_ads.sort(key=lambda x: x[1] * self._budget_multiplier(x[0]), reverse=True)
        
        # Select top ads
        selected_ads = scored_ads[:num_ads]
        
        # Convert to response format and track impressions
        result = []
        for ad, score in selected_ads:
            ad_dict = self._ad_to_dict(ad, score)
            self._track_impression(ad)
            result.append(ad_dict)
        
        return result

    def _is_ad_active(self, ad: Ad, current_time: datetime) -> bool:
        """Check if an ad is currently active"""
        return (
            ad.is_active and
            ad.start_date <= current_time <= ad.end_date and
            ad.spend < ad.budget and
            self._daily_spend(ad) < ad.daily_budget
        )

    def _calculate_ad_relevance(self, ad: Ad, user_profile: UserProfile, context: Dict = None) -> float:
        """Calculate relevance score for an ad and user profile"""
        score = 0.0
        
        # Segment matching (40% weight)
        if user_profile.segment in ad.target_segments:
            score += 0.4
        
        # Industry matching (20% weight)
        if ad.industry and user_profile.industry and ad.industry.lower() == user_profile.industry.lower():
            score += 0.2
        
        # Location matching (15% weight)
        if ad.location and user_profile.location:
            if ad.location.lower() == "remote" or ad.location.lower() in user_profile.location.lower():
                score += 0.15
        
        # Keyword/Skills matching (15% weight)
        if ad.keywords and user_profile.skills:
            keyword_matches = len(set(kw.lower() for kw in ad.keywords) & 
                                set(skill.lower() for skill in user_profile.skills))
            if keyword_matches > 0:
                score += 0.15 * min(keyword_matches / len(ad.keywords), 1.0)
        
        # Recent search relevance (10% weight)
        if ad.keywords and user_profile.recent_searches:
            search_matches = sum(1 for search in user_profile.recent_searches 
                               if any(kw.lower() in search.lower() for kw in ad.keywords))
            if search_matches > 0:
                score += 0.1 * min(search_matches / len(user_profile.recent_searches), 1.0)
        
        # Context-based adjustments
        if context:
            score *= self._apply_context_multiplier(ad, context)
        
        # Historical performance boost
        ctr = self._get_ad_ctr(ad)
        if ctr > 0.02:  # Above average CTR
            score *= 1.2
        
        return max(0.0, min(score, 1.0))

    def _budget_multiplier(self, ad: Ad) -> float:
        """Calculate budget-based multiplier for ad selection"""
        budget_remaining = (ad.budget - ad.spend) / ad.budget if ad.budget > 0 else 0
        daily_budget_remaining = (ad.daily_budget - self._daily_spend(ad)) / ad.daily_budget if ad.daily_budget > 0 else 0
        
        # Prioritize ads with higher remaining budget
        return (budget_remaining * 0.7 + daily_budget_remaining * 0.3) * ad.priority

    def _daily_spend(self, ad: Ad) -> float:
        """Calculate today's spend for an ad"""
        today = datetime.utcnow().date()
        daily_history = [h for h in self.ad_performance_history[ad.id] 
                        if h['date'].date() == today]
        return sum(h.get('spend', 0) for h in daily_history)

    def _apply_context_multiplier(self, ad: Ad, context: Dict) -> float:
        """Apply context-based multipliers to ad relevance"""
        multiplier = 1.0
        
        # Page context
        current_page = context.get('page', '')
        if current_page == 'jobs' and ad.ad_type == AdType.JOB_LISTING:
            multiplier *= 1.3
        elif current_page == 'companies' and ad.ad_type == AdType.SPONSORED_COMPANY:
            multiplier *= 1.4
        elif current_page == 'profile' and ad.ad_type in [AdType.RESUME_BUILDER, AdType.CAREER_SERVICE]:
            multiplier *= 1.2
        
        # Time of day
        current_hour = datetime.utcnow().hour
        if 9 <= current_hour <= 17:  # Business hours
            if ad.ad_type == AdType.RECRUITMENT_TOOL:
                multiplier *= 1.2
        else:  # Evening/weekend
            if ad.ad_type in [AdType.COURSE_PROMOTION, AdType.RESUME_BUILDER]:
                multiplier *= 1.1
        
        return multiplier

    def _get_ad_ctr(self, ad: Ad) -> float:
        """Calculate click-through rate for an ad"""
        if ad.impressions == 0:
            return 0.0
        return ad.clicks / ad.impressions

    def _ad_to_dict(self, ad: Ad, relevance_score: float) -> Dict:
        """Convert Ad object to dictionary for API response"""
        return {
            'id': ad.id,
            'title': ad.title,
            'description': ad.description,
            'image_url': ad.image_url,
            'click_url': ad.click_url,
            'ad_type': ad.ad_type.value,
            'relevance_score': round(relevance_score, 3),
            'company_id': ad.company_id,
            'industry': ad.industry,
            'keywords': ad.keywords
        }

    def _track_impression(self, ad: Ad):
        """Track ad impression"""
        ad.impressions += 1
        self._log_performance_event(ad.id, 'impression', 0)

    def track_click(self, ad_id: str, user_id: str = None) -> bool:
        """Track ad click and update metrics"""
        ad = next((a for a in self.ads if a.id == ad_id), None)
        if not ad:
            return False
        
        ad.clicks += 1
        cost = ad.cpc
        ad.spend += cost
        
        self._log_performance_event(ad_id, 'click', cost, user_id)
        return True

    def track_conversion(self, ad_id: str, user_id: str = None, conversion_value: float = 0) -> bool:
        """Track ad conversion"""
        ad = next((a for a in self.ads if a.id == ad_id), None)
        if not ad:
            return False
        
        ad.conversions += 1
        self._log_performance_event(ad_id, 'conversion', conversion_value, user_id)
        return True

    def _log_performance_event(self, ad_id: str, event_type: str, cost: float, user_id: str = None):
        """Log performance event for analytics"""
        event = {
            'ad_id': ad_id,
            'event_type': event_type,
            'cost': cost,
            'user_id': user_id,
            'date': datetime.utcnow(),
            'spend': cost if event_type == 'click' else 0
        }
        self.ad_performance_history[ad_id].append(event)

    def get_ad_analytics(self, ad_id: str = None, date_range: int = 30) -> Dict:
        """Get comprehensive analytics for ads"""
        start_date = datetime.utcnow() - timedelta(days=date_range)
        
        if ad_id:
            ads_to_analyze = [a for a in self.ads if a.id == ad_id]
        else:
            ads_to_analyze = self.ads
        
        analytics = {
            'summary': {
                'total_ads': len(ads_to_analyze),
                'total_impressions': sum(ad.impressions for ad in ads_to_analyze),
                'total_clicks': sum(ad.clicks for ad in ads_to_analyze),
                'total_conversions': sum(ad.conversions for ad in ads_to_analyze),
                'total_spend': sum(ad.spend for ad in ads_to_analyze),
                'average_ctr': 0,
                'average_cpc': 0,
                'conversion_rate': 0
            },
            'ads': []
        }
        
        # Calculate summary metrics
        if analytics['summary']['total_impressions'] > 0:
            analytics['summary']['average_ctr'] = analytics['summary']['total_clicks'] / analytics['summary']['total_impressions']
        
        if analytics['summary']['total_clicks'] > 0:
            analytics['summary']['average_cpc'] = analytics['summary']['total_spend'] / analytics['summary']['total_clicks']
            analytics['summary']['conversion_rate'] = analytics['summary']['total_conversions'] / analytics['summary']['total_clicks']
        
        # Individual ad analytics
        for ad in ads_to_analyze:
            ad_analytics = {
                'id': ad.id,
                'title': ad.title,
                'impressions': ad.impressions,
                'clicks': ad.clicks,
                'conversions': ad.conversions,
                'spend': ad.spend,
                'ctr': ad.clicks / ad.impressions if ad.impressions > 0 else 0,
                'cpc': ad.spend / ad.clicks if ad.clicks > 0 else 0,
                'conversion_rate': ad.conversions / ad.clicks if ad.clicks > 0 else 0,
                'budget_utilization': ad.spend / ad.budget if ad.budget > 0 else 0
            }
            analytics['ads'].append(ad_analytics)
        
        return analytics

    def create_ad(self, ad_data: Dict) -> Ad:
        """Create a new advertisement"""
        ad = Ad(
            id=ad_data.get('id', f"ad_{len(self.ads) + 1:03d}"),
            title=ad_data['title'],
            description=ad_data['description'],
            image_url=ad_data['image_url'],
            click_url=ad_data['click_url'],
            ad_type=AdType(ad_data['ad_type']),
            target_segments=[UserSegment(seg) for seg in ad_data['target_segments']],
            budget=ad_data['budget'],
            daily_budget=ad_data['daily_budget'],
            cpc=ad_data['cpc'],
            cpm=ad_data['cpm'],
            start_date=datetime.fromisoformat(ad_data['start_date']),
            end_date=datetime.fromisoformat(ad_data['end_date']),
            keywords=ad_data['keywords'],
            industry=ad_data.get('industry'),
            location=ad_data.get('location'),
            company_id=ad_data.get('company_id'),
            priority=ad_data.get('priority', 1)
        )
        
        self.ads.append(ad)
        return ad

    def update_ad(self, ad_id: str, updates: Dict) -> bool:
        """Update an existing advertisement"""
        ad = next((a for a in self.ads if a.id == ad_id), None)
        if not ad:
            return False
        
        for key, value in updates.items():
            if hasattr(ad, key):
                if key == 'ad_type':
                    setattr(ad, key, AdType(value))
                elif key == 'target_segments':
                    setattr(ad, key, [UserSegment(seg) for seg in value])
                elif key in ['start_date', 'end_date']:
                    setattr(ad, key, datetime.fromisoformat(value))
                else:
                    setattr(ad, key, value)
        
        return True

    def delete_ad(self, ad_id: str) -> bool:
        """Delete an advertisement"""
        self.ads = [ad for ad in self.ads if ad.id != ad_id]
        if ad_id in self.ad_performance_history:
            del self.ad_performance_history[ad_id]
        return True

# Factory function for easy initialization
def create_ad_engine() -> AdEngine:
    """Create and return a new AdEngine instance"""
    return AdEngine()

# Usage example
if __name__ == "__main__":
    # Initialize ad engine
    engine = create_ad_engine()
    
    # Example user data
    user_data = {
        'user_id': 'user_123',
        'job_searches': ['python developer', 'remote work', 'senior engineer'],
        'job_applications': ['app_1', 'app_2'],
        'skills': ['Python', 'React', 'AWS'],
        'industry': 'Technology',
        'location': 'San Francisco, CA',
        'profile_completeness': 85
    }
    
    # Get personalized ads
    ads = engine.select_ads(user_data, num_ads=3)
    print("Selected ads:", json.dumps(ads, indent=2))
    
    # Track a click
    if ads:
        engine.track_click(ads[0]['id'], user_data['user_id'])
    
    # Get analytics
    analytics = engine.get_ad_analytics()
    print("Analytics:", json.dumps(analytics, indent=2, default=str))
