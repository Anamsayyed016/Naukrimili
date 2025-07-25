from typing import Dict, List, Tuple
import re
from collections import Counter
from textblob import TextBlob
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class ATSScorer:
    # Required sections in a resume
    REQUIRED_SECTIONS = {
        'experience': ['experience', 'work history', 'employment'],
        'education': ['education', 'academic', 'qualification'],
        'skills': ['skills', 'technical skills', 'competencies'],
        'contact': ['contact', 'email', 'phone', 'address']
    }
    
    # Common section headers
    SECTION_HEADERS = {
        'summary': ['summary', 'objective', 'profile'],
        'achievements': ['achievements', 'accomplishments'],
        'projects': ['projects', 'portfolio'],
        'certifications': ['certifications', 'certificates'],
        'languages': ['languages', 'language proficiency']
    }
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2)
        )

    def calculate_ats_score(self, resume_text: str, job_desc: str) -> Dict:
        """
        Calculate the ATS score for a resume based on multiple criteria.
        
        Args:
            resume_text: The text content of the resume
            job_desc: The job description text
        
        Returns:
            Dictionary containing overall score and component scores
        """
        try:
            # Normalize texts
            resume_text = resume_text.lower()
            job_desc = job_desc.lower()
            
            # Calculate component scores
            keyword_score = self._calculate_keyword_match(resume_text, job_desc)
            completeness_score = self._check_section_completeness(resume_text)
            readability_score = self._calculate_readability(resume_text)
            experience_score = self._calculate_experience_alignment(resume_text, job_desc)
            
            # Calculate weighted total (weights should sum to 1)
            weights = {
                'keyword_match': 0.30,
                'completeness': 0.20,
                'readability': 0.20,
                'experience': 0.30
            }
            
            total_score = (
                keyword_score * weights['keyword_match'] +
                completeness_score * weights['completeness'] +
                readability_score * weights['readability'] +
                experience_score * weights['experience']
            )
            
            return {
                'total_score': round(total_score, 2),
                'component_scores': {
                    'keyword_match': round(keyword_score, 2),
                    'completeness': round(completeness_score, 2),
                    'readability': round(readability_score, 2),
                    'experience': round(experience_score, 2)
                },
                'feedback': self._generate_feedback(
                    keyword_score,
                    completeness_score,
                    readability_score,
                    experience_score
                )
            }
            
        except Exception as e:
            print(f"Error calculating ATS score: {e}")
            return {
                'total_score': 0,
                'component_scores': {
                    'keyword_match': 0,
                    'completeness': 0,
                    'readability': 0,
                    'experience': 0
                },
                'feedback': ['Error processing resume']
            }

    def _calculate_keyword_match(self, resume_text: str, job_desc: str) -> float:
        """Calculate keyword matching score using TF-IDF and cosine similarity."""
        try:
            # Create TF-IDF matrix
            tfidf_matrix = self.vectorizer.fit_transform([job_desc, resume_text])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Convert to percentage (0-100)
            return similarity * 100
        except:
            return 0

    def _check_section_completeness(self, text: str) -> float:
        """Check if all required sections are present."""
        text = text.lower()
        sections_found = {
            section: any(header in text for header in headers)
            for section, headers in self.REQUIRED_SECTIONS.items()
        }
        
        # Calculate percentage of required sections present
        completeness = sum(sections_found.values()) / len(self.REQUIRED_SECTIONS) * 100
        
        return completeness

    def _calculate_readability(self, text: str) -> float:
        """Calculate readability score using TextBlob."""
        try:
            blob = TextBlob(text)
            
            # Calculate average sentence length
            avg_sentence_length = np.mean([len(sentence.words) 
                                         for sentence in blob.sentences])
            
            # Penalize very short or very long sentences
            length_score = 100 - min(abs(avg_sentence_length - 20) * 5, 50)
            
            # Check for proper formatting
            formatting_score = self._check_formatting(text)
            
            return (length_score * 0.7 + formatting_score * 0.3)
        except:
            return 0

    def _check_formatting(self, text: str) -> float:
        """Check document formatting."""
        score = 100
        
        # Penalize for excessive newlines
        if text.count('\n\n\n') > 0:
            score -= 10
            
        # Penalize for very long paragraphs
        paragraphs = text.split('\n\n')
        for p in paragraphs:
            if len(p.split()) > 100:
                score -= 5
                
        # Penalize for very short paragraphs
        if any(len(p.split()) < 3 for p in paragraphs):
            score -= 5
            
        return max(0, score)

    def _calculate_experience_alignment(self, resume_text: str, job_desc: str) -> float:
        """Calculate how well the experience matches job requirements."""
        try:
            # Extract years of experience mentioned
            resume_years = self._extract_years_of_experience(resume_text)
            required_years = self._extract_years_of_experience(job_desc)
            
            # If no years mentioned in job description, focus on skill matching
            if required_years == 0:
                return self._calculate_skill_alignment(resume_text, job_desc)
            
            # Calculate experience match score
            if resume_years >= required_years:
                years_score = 100
            else:
                years_score = (resume_years / required_years) * 100
                
            # Combine with skill alignment
            skill_score = self._calculate_skill_alignment(resume_text, job_desc)
            
            return (years_score * 0.4 + skill_score * 0.6)
        except:
            return 0

    def _extract_years_of_experience(self, text: str) -> int:
        """Extract years of experience from text."""
        patterns = [
            r'(\d+)\+?\s*years?(?:\s+of)?\s+experience',
            r'experience\s*(?:of|for)?\s*(\d+)\+?\s*years?'
        ]
        
        years = []
        for pattern in patterns:
            matches = re.finditer(pattern, text.lower())
            years.extend(int(m.group(1)) for m in matches)
            
        return max(years) if years else 0

    def _calculate_skill_alignment(self, resume_text: str, job_desc: str) -> float:
        """Calculate alignment of skills between resume and job description."""
        try:
            # Extract skills using keyword matching
            job_skills = set(self._extract_skills(job_desc))
            resume_skills = set(self._extract_skills(resume_text))
            
            if not job_skills:
                return 0
                
            # Calculate match percentage
            matched_skills = job_skills.intersection(resume_skills)
            return len(matched_skills) / len(job_skills) * 100
        except:
            return 0

    def _extract_skills(self, text: str) -> List[str]:
        """Extract potential skills from text."""
        # Common skill keywords
        skill_patterns = [
            r'proficient\s+in\s+([^.,:;]*)',
            r'experience\s+with\s+([^.,:;]*)',
            r'skilled\s+in\s+([^.,:;]*)',
            r'knowledge\s+of\s+([^.,:;]*)',
            r'expertise\s+in\s+([^.,:;]*)'
        ]
        
        skills = []
        for pattern in skill_patterns:
            matches = re.finditer(pattern, text.lower())
            skills.extend(m.group(1).strip() for m in matches)
            
        return skills

    def _generate_feedback(self, keyword_score: float, completeness_score: float,
                         readability_score: float, experience_score: float) -> List[str]:
        """Generate specific feedback based on scores."""
        feedback = []
        
        if keyword_score < 60:
            feedback.append("Consider adding more relevant keywords from the job description")
            
        if completeness_score < 80:
            feedback.append("Some important sections may be missing from your resume")
            
        if readability_score < 70:
            feedback.append("Improve resume formatting and sentence structure for better readability")
            
        if experience_score < 60:
            feedback.append("Your experience may not fully align with the job requirements")
            
        if not feedback:
            feedback.append("Your resume is well-optimized for this position")
            
        return feedback

# Example usage:
"""
scorer = ATSScorer()
score = scorer.calculate_ats_score(resume_text, job_description)
print(f"Total Score: {score['total_score']}")
print("\nComponent Scores:")
for component, score in score['component_scores'].items():
    print(f"{component}: {score}")
print("\nFeedback:")
for feedback in score['feedback']:
    print(f"- {feedback}")
"""
