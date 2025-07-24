"""
ATS (Applicant Tracking System) Module
Provides resume scoring and optimization feedback
"""

import re
import nltk
from collections import Counter
from typing import Dict, List, Tuple
import json
from datetime import datetime

# Download required NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

class ATSModel:
    """Mock ATS Model for resume scoring"""
    
    def __init__(self):
        self.power_verbs = {
            'achieved', 'accomplished', 'adapted', 'administered', 'analyzed', 'appointed',
            'approved', 'arranged', 'assembled', 'assigned', 'assisted', 'attained',
            'authorized', 'awarded', 'built', 'calculated', 'chaired', 'coached',
            'collaborated', 'collected', 'compiled', 'completed', 'computed', 'conceived',
            'conducted', 'consolidated', 'constructed', 'consulted', 'controlled', 'converted',
            'coordinated', 'created', 'customized', 'delivered', 'demonstrated', 'designed',
            'developed', 'directed', 'discovered', 'doubled', 'earned', 'educated',
            'eliminated', 'enabled', 'encouraged', 'engineered', 'enhanced', 'established',
            'evaluated', 'exceeded', 'executed', 'expanded', 'expedited', 'facilitated',
            'focused', 'forecasted', 'formulated', 'founded', 'generated', 'guided',
            'headed', 'identified', 'implemented', 'improved', 'increased', 'influenced',
            'initiated', 'innovated', 'inspired', 'installed', 'instituted', 'integrated',
            'introduced', 'invented', 'launched', 'led', 'managed', 'maximized',
            'mentored', 'modernized', 'modified', 'motivated', 'negotiated', 'operated',
            'optimized', 'organized', 'originated', 'overhauled', 'oversaw', 'partnered',
            'performed', 'pioneered', 'planned', 'presented', 'prioritized', 'produced',
            'programmed', 'promoted', 'proposed', 'provided', 'published', 'pursued',
            'recommended', 'recruited', 'redesigned', 'reduced', 'refined', 'reorganized',
            'replaced', 'researched', 'resolved', 'restored', 'restructured', 'revamped',
            'reviewed', 'revised', 'scheduled', 'selected', 'simplified', 'solved',
            'spearheaded', 'specialized', 'standardized', 'streamlined', 'strengthened',
            'supervised', 'supported', 'surpassed', 'trained', 'transformed', 'upgraded',
            'utilized', 'validated', 'volunteered'
        }
        
        self.technical_skills = {
            # Programming Languages
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby',
            'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql',
            
            # Web Technologies
            'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django',
            'flask', 'spring', 'laravel', 'rails', 'asp.net',
            
            # Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle',
            'sqlite', 'cassandra', 'dynamodb',
            
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
            'ansible', 'puppet', 'chef', 'git', 'gitlab', 'github',
            
            # Data Science & AI
            'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'matplotlib',
            'tableau', 'power bi', 'spark', 'hadoop', 'kafka',
            
            # Mobile Development
            'android', 'ios', 'react native', 'flutter', 'xamarin',
            
            # Other Technologies
            'linux', 'unix', 'windows', 'macos', 'bash', 'powershell', 'vim', 'vscode'
        }
        
        self.soft_skills = {
            'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
            'creative', 'adaptable', 'organized', 'detail-oriented', 'collaborative',
            'innovative', 'strategic', 'customer-focused', 'results-driven', 'proactive',
            'mentoring', 'coaching', 'negotiation', 'presentation', 'project management'
        }
        
        self.stop_words = set(stopwords.words('english'))
    
    def predict(self, resume_text: str, job_description: str) -> int:
        """Predict ATS score based on resume and job description match"""
        try:
            resume_text = resume_text.lower()
            job_description = job_description.lower()
            
            # Extract keywords from job description
            job_keywords = self._extract_keywords(job_description)
            resume_keywords = self._extract_keywords(resume_text)
            
            # Calculate various scoring components
            keyword_match_score = self._calculate_keyword_match(job_keywords, resume_keywords)
            format_score = self._calculate_format_score(resume_text)
            content_quality_score = self._calculate_content_quality(resume_text)
            skills_match_score = self._calculate_skills_match(resume_text, job_description)
            
            # Weighted final score
            final_score = (
                keyword_match_score * 0.3 +
                format_score * 0.2 +
                content_quality_score * 0.25 +
                skills_match_score * 0.25
            )
            
            return min(int(final_score), 100)
            
        except Exception as e:
            print(f"Error in ATS prediction: {e}")
            return 0
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from text"""
        # Tokenize and remove stop words
        tokens = word_tokenize(text.lower())
        keywords = [word for word in tokens if word.isalnum() and word not in self.stop_words and len(word) > 2]
        
        # Add multi-word technical terms
        multi_word_terms = []
        text_lower = text.lower()
        for skill in self.technical_skills:
            if skill in text_lower:
                multi_word_terms.append(skill.replace(' ', '_'))
        
        return keywords + multi_word_terms
    
    def _calculate_keyword_match(self, job_keywords: List[str], resume_keywords: List[str]) -> float:
        """Calculate keyword match percentage"""
        if not job_keywords:
            return 0
        
        job_counter = Counter(job_keywords)
        resume_counter = Counter(resume_keywords)
        
        matches = 0
        total_job_keywords = len(job_counter)
        
        for keyword in job_counter:
            if keyword in resume_counter:
                matches += 1
        
        return (matches / total_job_keywords) * 100 if total_job_keywords > 0 else 0
    
    def _calculate_format_score(self, resume_text: str) -> float:
        """Calculate score based on resume format and structure"""
        score = 0
        
        # Check for essential sections
        sections = ['experience', 'education', 'skills', 'summary', 'objective']
        section_matches = sum(1 for section in sections if section in resume_text.lower())
        score += (section_matches / len(sections)) * 40
        
        # Check for contact information
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        
        if re.search(email_pattern, resume_text):
            score += 10
        if re.search(phone_pattern, resume_text):
            score += 10
        
        # Check for proper length (not too short, not too long)
        word_count = len(resume_text.split())
        if 200 <= word_count <= 800:
            score += 20
        elif word_count < 200:
            score += 5
        else:
            score += 10
        
        # Check for bullet points or structured content
        if '•' in resume_text or '-' in resume_text or re.search(r'\n\s*[\*\-\+]', resume_text):
            score += 10
        
        # Check for dates (employment history)
        date_pattern = r'\b(19|20)\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b'
        if re.search(date_pattern, resume_text, re.IGNORECASE):
            score += 10
        
        return min(score, 100)
    
    def _calculate_content_quality(self, resume_text: str) -> float:
        """Calculate content quality score"""
        score = 0
        resume_lower = resume_text.lower()
        
        # Check for power verbs
        power_verb_count = sum(1 for verb in self.power_verbs if verb in resume_lower)
        score += min(power_verb_count * 2, 30)
        
        # Check for quantifiable achievements (numbers, percentages)
        number_pattern = r'\b\d+([%$]|\s*(percent|million|thousand|k|m|billion))\b'
        quantifiable_achievements = len(re.findall(number_pattern, resume_text, re.IGNORECASE))
        score += min(quantifiable_achievements * 5, 25)
        
        # Check for industry buzzwords and skills
        tech_skills_found = sum(1 for skill in self.technical_skills if skill in resume_lower)
        score += min(tech_skills_found * 2, 20)
        
        # Check for soft skills
        soft_skills_found = sum(1 for skill in self.soft_skills if skill in resume_lower)
        score += min(soft_skills_found * 1.5, 15)
        
        # Penalize for common mistakes
        if 'responsible for' in resume_lower:
            score -= 5  # Encourage action verbs instead
        
        # Check sentence structure variety
        sentences = sent_tokenize(resume_text)
        if len(sentences) > 0:
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
            if 10 <= avg_sentence_length <= 20:
                score += 10
        
        return min(score, 100)
    
    def _calculate_skills_match(self, resume_text: str, job_description: str) -> float:
        """Calculate how well resume skills match job requirements"""
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Extract required skills from job description
        job_tech_skills = [skill for skill in self.technical_skills if skill in job_lower]
        job_soft_skills = [skill for skill in self.soft_skills if skill in job_lower]
        
        # Extract skills from resume
        resume_tech_skills = [skill for skill in self.technical_skills if skill in resume_lower]
        resume_soft_skills = [skill for skill in self.soft_skills if skill in resume_lower]
        
        # Calculate match percentages
        tech_match = 0
        if job_tech_skills:
            tech_match = len(set(job_tech_skills) & set(resume_tech_skills)) / len(job_tech_skills) * 60
        
        soft_match = 0
        if job_soft_skills:
            soft_match = len(set(job_soft_skills) & set(resume_soft_skills)) / len(job_soft_skills) * 40
        
        return min(tech_match + soft_match, 100)

def load_ats_model():
    """Load the ATS model (currently returns mock model)"""
    return ATSModel()

def generate_feedback(resume_text: str) -> List[str]:
    """Generate improvement feedback for resume"""
    feedback = []
    resume_lower = resume_text.lower()
    
    # Load model for analysis
    model = load_ats_model()
    
    # Check for power verbs
    power_verb_count = sum(1 for verb in model.power_verbs if verb in resume_lower)
    if power_verb_count < 5:
        feedback.append("Add more power verbs to describe your achievements (e.g., 'led', 'developed', 'increased')")
    
    # Check for quantifiable metrics
    number_pattern = r'\b\d+([%$]|\s*(percent|million|thousand|k|m|billion))\b'
    metrics_count = len(re.findall(number_pattern, resume_text, re.IGNORECASE))
    if metrics_count < 3:
        feedback.append("Include more quantifiable metrics and achievements (e.g., 'Increased sales by 25%')")
    
    # Check for essential sections
    sections = {'experience': 'work experience', 'education': 'education', 'skills': 'skills section'}
    for section, description in sections.items():
        if section not in resume_lower:
            feedback.append(f"Consider adding a {description} to your resume")
    
    # Check for contact information
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    if not re.search(email_pattern, resume_text):
        feedback.append("Ensure your email address is clearly visible")
    
    # Check for passive language
    if 'responsible for' in resume_lower:
        feedback.append("Replace passive phrases like 'responsible for' with active power verbs")
    
    # Check for technical skills
    tech_skills_count = sum(1 for skill in model.technical_skills if skill in resume_lower)
    if tech_skills_count < 5:
        feedback.append("Add more relevant technical skills to match job requirements")
    
    # Check resume length
    word_count = len(resume_text.split())
    if word_count < 200:
        feedback.append("Your resume might be too short. Consider adding more details about your experience")
    elif word_count > 800:
        feedback.append("Your resume might be too long. Consider condensing to the most relevant information")
    
    # Check for formatting
    if not ('•' in resume_text or '-' in resume_text or re.search(r'\n\s*[\*\-\+]', resume_text)):
        feedback.append("Use bullet points to improve readability and ATS parsing")
    
    # Check for soft skills
    soft_skills_count = sum(1 for skill in model.soft_skills if skill in resume_lower)
    if soft_skills_count < 3:
        feedback.append("Include relevant soft skills like leadership, communication, or teamwork")
    
    # If no specific feedback, provide general advice
    if not feedback:
        feedback.append("Your resume looks good! Continue to tailor it for specific job applications")
    
    return feedback[:5]  # Limit to top 5 feedback items

def calculate_ats_score(resume_text: str, job_description: str) -> Dict:
    """
    Calculate ATS score and provide feedback
    
    Args:
        resume_text: The resume content as string
        job_description: The job description as string
    
    Returns:
        Dictionary with score and feedback:
        {
            "score": 87,
            "feedback": ["Add more power verbs", "Include metrics"],
            "details": {
                "keyword_match": 75,
                "format_score": 90,
                "content_quality": 85,
                "skills_match": 80
            },
            "timestamp": "2024-07-24T17:25:37Z"
        }
    """
    try:
        # Validate inputs
        if not resume_text or not resume_text.strip():
            return {
                "score": 0,
                "feedback": ["Resume text is required"],
                "details": {},
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        
        if not job_description or not job_description.strip():
            # If no job description, use generic scoring
            job_description = "Looking for experienced professional with relevant skills and achievements"
        
        # Load model and calculate score
        model = load_ats_model()
        score = model.predict(resume_text, job_description)
        feedback = generate_feedback(resume_text)
        
        # Calculate detailed breakdown
        resume_keywords = model._extract_keywords(resume_text.lower())
        job_keywords = model._extract_keywords(job_description.lower())
        
        details = {
            "keyword_match": model._calculate_keyword_match(job_keywords, resume_keywords),
            "format_score": model._calculate_format_score(resume_text),
            "content_quality": model._calculate_content_quality(resume_text),
            "skills_match": model._calculate_skills_match(resume_text, job_description)
        }
        
        return {
            "score": score,
            "feedback": feedback,
            "details": details,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except Exception as e:
        return {
            "score": 0,
            "feedback": [f"Error calculating ATS score: {str(e)}"],
            "details": {},
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

def optimize_resume_for_ats(resume_text: str, job_description: str) -> Dict:
    """
    Provide specific optimization suggestions for ATS
    
    Args:
        resume_text: Current resume content
        job_description: Target job description
    
    Returns:
        Dictionary with optimization suggestions
    """
    try:
        model = load_ats_model()
        current_score = calculate_ats_score(resume_text, job_description)
        
        # Extract missing keywords from job description
        job_keywords = set(model._extract_keywords(job_description.lower()))
        resume_keywords = set(model._extract_keywords(resume_text.lower()))
        missing_keywords = list(job_keywords - resume_keywords)[:10]  # Top 10 missing
        
        # Find missing skills
        job_tech_skills = [skill for skill in model.technical_skills if skill in job_description.lower()]
        resume_tech_skills = [skill for skill in model.technical_skills if skill in resume_text.lower()]
        missing_tech_skills = list(set(job_tech_skills) - set(resume_tech_skills))[:5]
        
        suggestions = {
            "current_score": current_score["score"],
            "potential_score": min(current_score["score"] + 15, 100),
            "missing_keywords": missing_keywords,
            "missing_skills": missing_tech_skills,
            "priority_improvements": [
                "Add more quantifiable achievements with numbers and percentages",
                "Include industry-specific keywords from the job description",
                "Use more action verbs to start bullet points",
                "Ensure proper formatting with clear sections and bullet points",
                "Match technical skills mentioned in job requirements"
            ][:3],
            "formatting_tips": [
                "Use standard section headers (Experience, Education, Skills)",
                "Keep consistent formatting throughout",
                "Use bullet points for easy scanning",
                "Include contact information at the top",
                "Save as PDF to preserve formatting"
            ]
        }
        
        return suggestions
        
    except Exception as e:
        return {
            "error": f"Error optimizing resume: {str(e)}",
            "current_score": 0,
            "potential_score": 0
        }

def analyze_resume_competitiveness(resume_text: str, industry: str = "tech") -> Dict:
    """
    Analyze how competitive a resume is in the market
    
    Args:
        resume_text: Resume content
        industry: Target industry (tech, finance, marketing, etc.)
    
    Returns:
        Competitiveness analysis with market insights
    """
    try:
        model = load_ats_model()
        
        # Industry-specific skill weights
        industry_weights = {
            "tech": {
                "technical_skills": 0.4,
                "quantifiable_achievements": 0.3,
                "relevant_experience": 0.2,
                "education": 0.1
            },
            "finance": {
                "quantifiable_achievements": 0.4,
                "relevant_experience": 0.3,
                "technical_skills": 0.2,
                "education": 0.1
            },
            "marketing": {
                "quantifiable_achievements": 0.35,
                "relevant_experience": 0.3,
                "technical_skills": 0.2,
                "education": 0.15
            }
        }
        
        weights = industry_weights.get(industry.lower(), industry_weights["tech"])
        resume_lower = resume_text.lower()
        
        # Calculate component scores
        tech_score = min(sum(1 for skill in model.technical_skills if skill in resume_lower) * 5, 100)
        metrics_count = len(re.findall(r'\b\d+([%$]|\s*(percent|million|thousand|k|m|billion))\b', resume_text, re.IGNORECASE))
        achievement_score = min(metrics_count * 15, 100)
        
        experience_indicators = ['years', 'led', 'managed', 'developed', 'created', 'increased']
        experience_score = min(sum(1 for indicator in experience_indicators if indicator in resume_lower) * 10, 100)
        
        education_score = 70 if any(degree in resume_lower for degree in ['bachelor', 'master', 'phd', 'degree']) else 40
        
        # Weighted competitiveness score
        competitiveness_score = (
            tech_score * weights["technical_skills"] +
            achievement_score * weights["quantifiable_achievements"] +
            experience_score * weights["relevant_experience"] +
            education_score * weights["education"]
        )
        
        # Market positioning
        if competitiveness_score >= 80:
            market_position = "Highly Competitive"
            percentile = "Top 10%"
        elif competitiveness_score >= 65:
            market_position = "Competitive"
            percentile = "Top 25%"
        elif competitiveness_score >= 50:
            market_position = "Moderately Competitive"
            percentile = "Top 50%"
        else:
            market_position = "Needs Improvement"
            percentile = "Bottom 50%"
        
        return {
            "competitiveness_score": round(competitiveness_score, 1),
            "market_position": market_position,
            "percentile": percentile,
            "industry": industry.title(),
            "component_scores": {
                "technical_skills": round(tech_score, 1),
                "achievements": round(achievement_score, 1),
                "experience": round(experience_score, 1),
                "education": round(education_score, 1)
            },
            "recommendations": _get_competitiveness_recommendations(competitiveness_score, industry),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except Exception as e:
        return {
            "error": f"Error analyzing competitiveness: {str(e)}",
            "competitiveness_score": 0
        }

def _get_competitiveness_recommendations(score: float, industry: str) -> List[str]:
    """Get industry-specific recommendations based on competitiveness score"""
    recommendations = []
    
    if score < 50:
        recommendations.extend([
            f"Focus on acquiring in-demand {industry} skills",
            "Add more quantifiable achievements to demonstrate impact",
            "Consider additional certifications or training"
        ])
    elif score < 70:
        recommendations.extend([
            "Highlight leadership and project management experience",
            "Include more specific technical accomplishments",
            "Consider specializing in high-demand areas"
        ])
    else:
        recommendations.extend([
            "Your resume is highly competitive! Focus on targeting premium positions",
            "Consider mentoring or thought leadership opportunities",
            "Highlight unique value propositions and innovations"
        ])
    
    return recommendations

def generate_ats_report(resume_text: str, job_description: str = None) -> Dict:
    """
    Generate comprehensive ATS analysis report
    
    Args:
        resume_text: Resume content
        job_description: Optional job description for targeted analysis
    
    Returns:
        Complete ATS analysis report
    """
    try:
        # Basic ATS scoring
        ats_result = calculate_ats_score(resume_text, job_description or "")
        
        # Optimization suggestions
        optimization = optimize_resume_for_ats(resume_text, job_description or "")
        
        # Competitiveness analysis
        competitiveness = analyze_resume_competitiveness(resume_text)
        
        # Additional insights
        word_count = len(resume_text.split())
        readability_score = _calculate_readability_score(resume_text)
        
        report = {
            "summary": {
                "overall_score": ats_result["score"],
                "competitiveness": competitiveness["market_position"],
                "word_count": word_count,
                "readability": readability_score,
                "status": "Pass" if ats_result["score"] >= 70 else "Needs Improvement"
            },
            "ats_analysis": ats_result,
            "optimization": optimization,
            "competitiveness": competitiveness,
            "recommendations": {
                "immediate": ats_result["feedback"][:3],
                "strategic": competitiveness["recommendations"][:3],
                "formatting": optimization.get("formatting_tips", [])[:3]
            },
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        return report
        
    except Exception as e:
        return {
            "error": f"Error generating ATS report: {str(e)}",
            "summary": {"overall_score": 0, "status": "Error"}
        }

def _calculate_readability_score(text: str) -> str:
    """Calculate basic readability score"""
    try:
        sentences = len(sent_tokenize(text))
        words = len(text.split())
        
        if sentences == 0:
            return "Poor"
        
        avg_sentence_length = words / sentences
        
        if avg_sentence_length <= 15:
            return "Excellent"
        elif avg_sentence_length <= 20:
            return "Good"
        elif avg_sentence_length <= 25:
            return "Fair"
        else:
            return "Poor"
    except:
        return "Unknown"
