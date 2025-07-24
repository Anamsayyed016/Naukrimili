from flask import Blueprint, jsonify, request
from dataclasses import dataclass
import re
from typing import Dict, List, Tuple
from datetime import datetime

resume_blueprint = Blueprint('resume', __name__)

# Example data for testing
SAMPLE_RESUME = """
JOHN DOE
Software Engineer
john.doe@email.com • (123) 456-7890

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2020 - present
• Led development of microservices architecture using Python and Docker
• Managed team of 5 developers for cloud migration project
• Implemented CI/CD pipelines using Jenkins and Kubernetes

Software Engineer | StartupCo | 2018 - 2020
• Developed full-stack applications using JavaScript and React
• Improved application performance by 40%

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2014 - 2018

SKILLS
• Programming: Python, JavaScript, Java
• Frameworks: React, Django, Flask
• Tools: Git, Docker
• Soft Skills: Leadership, Communication, Problem Solving

PROJECTS
Cloud Migration Project
• Led successful migration of legacy systems to AWS
• Reduced operational costs by 30%
"""

SAMPLE_JOB_DESC = """
Senior Software Engineer
We are seeking an experienced Software Engineer to join our team.

Requirements:
• 5+ years experience in software development
• Strong proficiency in Python and JavaScript
• Experience with Docker and Kubernetes
• Knowledge of cloud platforms (AWS/Azure)
• Experience with microservices architecture
• Strong communication and leadership skills
• Bachelor's degree in Computer Science or related field

Responsibilities:
• Design and implement scalable solutions
• Lead technical projects and mentor junior developers
• Collaborate with cross-functional teams
• Maintain and improve CI/CD pipelines
"""

@dataclass
class ATSAnalyzer:
    # Common section headers in resumes
    SECTION_HEADERS = {
        'experience': ['experience', 'work experience', 'employment history', 'work history'],
        'education': ['education', 'academic background', 'qualifications', 'academic qualifications'],
        'skills': ['skills', 'technical skills', 'core competencies', 'competencies'],
        'projects': ['projects', 'personal projects', 'key projects']
    }
    
    # Common soft skills to look for
    SOFT_SKILLS = [
        'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
        'organized', 'time management', 'attention to detail', 'project management',
        'collaboration', 'adaptability', 'flexibility', 'initiative', 'interpersonal',
        'creative', 'innovation', 'strategic thinking', 'decision making'
    ]
    def _analyze_format(self, resume_text: str) -> Dict:
        """
        Analyze resume format and structure.
        
        Args:
            resume_text (str): Resume content
            
        Returns:
            dict: Format analysis results
        """
        lines = resume_text.split('\n')
        word_count = len(resume_text.split())
        
        return {
            "length": {
                "words": word_count,
                "lines": len(lines),
                "is_appropriate_length": 300 <= word_count <= 1000
            },
            "has_bullets": '•' in resume_text or '*' in resume_text,
            "sections_found": len(self._identify_sections(resume_text))
        }
        
    def analyze_resume(self, resume_text: str, job_desc: str) -> Dict:
        """
        Analyze a resume against a job description.
        
        Args:
            resume_text (str): The text content of the resume
            job_desc (str): The job description to compare against
            
        Returns:
            dict: Analysis results including match score and recommendations
        """
        # Convert texts to lowercase for better matching
        resume_lower = resume_text.lower()
        job_lower = job_desc.lower()
        
        # Identify resume sections
        sections = self._identify_sections(resume_text)
        
        # Extract key skills/requirements from job description
        key_terms = self._extract_key_terms(job_lower)
        
        # Calculate keyword matches
        matches = []
        missing = []
        for term in key_terms:
            if term in resume_lower:
                matches.append(term)
            else:
                missing.append(term)
                
        # Analyze experience if section exists
        experience_analysis = (
            self._analyze_experience(sections['experience'])
            if 'experience' in sections else {"total_years": 0, "experience_count": 0}
        )
        
        # Analyze education if section exists
        education_analysis = (
            self._analyze_education(sections['education'])
            if 'education' in sections else {"education_level": [], "has_education": False}
        )
        
        # Find soft skills
        soft_skills_found = [
            skill for skill in self.SOFT_SKILLS
            if skill in resume_lower
        ]
        
        # Analyze format
        format_analysis = self._analyze_format(resume_text)
        
        # Calculate match score (weighted average)
        keyword_score = (len(matches) / len(key_terms)) * 100 if key_terms else 0
        soft_skills_score = (len(soft_skills_found) / 5) * 100  # Expecting at least 5 soft skills
        format_score = 100 if format_analysis["length"]["is_appropriate_length"] else 60
        
        total_score = (keyword_score * 0.6 + soft_skills_score * 0.2 + format_score * 0.2)
        
        # Generate recommendations
        recommendations = []
        if missing:
            recommendations.append(f"Consider adding these missing keywords: {', '.join(missing)}")
        if len(soft_skills_found) < 5:
            recommendations.append("Add more soft skills to your resume")
        if not format_analysis["has_bullets"]:
            recommendations.append("Use bullet points to make your resume more readable")
        if not format_analysis["length"]["is_appropriate_length"]:
            recommendations.append("Adjust resume length to be between 300-1000 words")
        if experience_analysis["total_years"] < 2:
            recommendations.append("Consider adding more detailed work experience")
        if not education_analysis["has_education"]:
            recommendations.append("Add your educational background")
            
        return {
            "match_score": round(total_score, 2),
            "keyword_analysis": {
                "matched_keywords": matches,
                "missing_keywords": missing,
                "keyword_match_score": round(keyword_score, 2)
            },
            "experience_analysis": experience_analysis,
            "education_analysis": education_analysis,
            "soft_skills": {
                "found": soft_skills_found,
                "score": round(soft_skills_score, 2)
            },
            "format_analysis": format_analysis,
            "recommendations": recommendations
        }
    
    def _identify_sections(self, text: str) -> Dict[str, str]:
        """
        Identify different sections in the resume.
        
        Args:
            text (str): Resume text content
            
        Returns:
            dict: Sections and their content
        """
        sections = {}
        lines = text.split('\n')
        current_section = None
        section_content = []
        
        for line in lines:
            line_lower = line.lower().strip()
            # Check if line is a section header
            found_section = None
            for section, headers in self.SECTION_HEADERS.items():
                if any(header in line_lower for header in headers):
                    found_section = section
                    break
            
            if found_section:
                # Save previous section
                if current_section and section_content:
                    sections[current_section] = '\n'.join(section_content)
                # Start new section
                current_section = found_section
                section_content = []
            elif current_section and line.strip():
                section_content.append(line)
        
        # Save last section
        if current_section and section_content:
            sections[current_section] = '\n'.join(section_content)
            
        return sections
    
    def _analyze_experience(self, experience_text: str) -> Dict:
        """
        Analyze the experience section for years and relevance.
        
        Args:
            experience_text (str): Experience section content
            
        Returns:
            dict: Analysis results
        """
        # Look for year patterns (e.g., 2020-2023, 2020 - present)
        year_pattern = r'(\d{4})\s*[-–]\s*(present|\d{4})'
        matches = re.finditer(year_pattern, experience_text.lower())
        
        total_years = 0
        current_year = datetime.now().year
        
        for match in matches:
            start_year = int(match.group(1))
            end_year = current_year if 'present' in match.group(2) else int(match.group(2))
            total_years += end_year - start_year
            
        return {
            "total_years": total_years,
            "experience_count": len(re.findall(r'\b(year|years)\b', experience_text))
        }
    
    def _analyze_education(self, education_text: str) -> Dict:
        """
        Analyze education section for degrees and institutions.
        
        Args:
            education_text (str): Education section content
            
        Returns:
            dict: Analysis results
        """
        education_keywords = {
            'phd': ['phd', 'doctorate', 'ph.d'],
            'masters': ['master', 'msc', 'ms', 'ma', 'mba'],
            'bachelors': ['bachelor', 'bsc', 'bs', 'ba', 'btech', 'be'],
            'associate': ['associate', 'diploma']
        }
        
        education_level = []
        for level, keywords in education_keywords.items():
            if any(keyword in education_text.lower() for keyword in keywords):
                education_level.append(level)
                
        return {
            "education_level": education_level,
            "has_education": bool(education_level)
        }

    def _extract_key_terms(self, job_desc: str) -> List[str]:
        """
        Extract key terms from job description.
        
        Args:
            job_desc (str): Job description text
            
        Returns:
            list: List of key terms found
        """
        # Common skill-related keywords that often precede requirements
        skill_indicators = [
            "required", "requirements", "qualifications", "skills",
            "experience with", "knowledge of", "proficiency in",
            "expertise in", "familiarity with"
        ]
        
        # Split into sentences and look for skills
        terms = set()
        sentences = re.split('[.•]', job_desc)
        
        for sentence in sentences:
            # Check if sentence contains skill indicators
            if any(indicator in sentence.lower() for indicator in skill_indicators):
                # Extract words that might be skills (simple implementation)
                # Exclude common words, focus on technical terms
                words = re.findall(r'\b[A-Za-z+#]+\b', sentence)
                terms.update([w.lower() for w in words if len(w) > 2])
        
        return list(terms)

@resume_blueprint.route('/analyze/sample', methods=['GET'])
def analyze_sample():
    """Get a sample analysis using example resume and job description."""
    try:
        analyzer = ATSAnalyzer()
        result = analyzer.analyze_resume(SAMPLE_RESUME, SAMPLE_JOB_DESC)
        return jsonify({
            "success": True,
            "analysis": result,
            "sample_data": {
                "resume": SAMPLE_RESUME,
                "job_description": SAMPLE_JOB_DESC
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Sample analysis failed: {str(e)}"
        }), 500

@resume_blueprint.route('/analyze', methods=['POST'])
def analyze_resume():
    """
    Analyze a resume against a job description using ATS scoring.
    
    Expected JSON input:
    {
        "text": "Resume content...",
        "job_description": "Job description content..."
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        resume_text = data.get('text')
        job_desc = data.get('job_description')
        
        if not resume_text or not job_desc:
            return jsonify({
                "error": "Missing required fields. Both 'text' and 'job_description' are required"
            }), 400
            
        analyzer = ATSAnalyzer()
        result = analyzer.analyze_resume(resume_text, job_desc)
        
        return jsonify({
            "success": True,
            "analysis": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Analysis failed: {str(e)}"
        }), 500
