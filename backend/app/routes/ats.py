from flask import Blueprint, request, jsonify
from app.utils.ats import ATSScorer
import base64

ats_bp = Blueprint('ats', __name__)
scorer = ATSScorer()

@ats_bp.route('/api/ats/score', methods=['POST'])
def score_resume():
    """
    Score a resume against a job description using the ATS scoring system.
    
    Expected JSON body:
    {
        "resume": "base64_encoded_resume_text",
        "jobDescription": "base64_encoded_job_description",
        "fileType": "pdf" | "docx" | "txt" (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'resume' not in data or 'jobDescription' not in data:
            return jsonify({
                'error': 'Missing required fields: resume and jobDescription'
            }), 400

        # Decode base64 content
        try:
            resume_text = base64.b64decode(data['resume']).decode('utf-8')
            job_desc = base64.b64decode(data['jobDescription']).decode('utf-8')
        except:
            return jsonify({
                'error': 'Invalid base64 encoding for resume or job description'
            }), 400

        # Get file type
        file_type = data.get('fileType', 'txt').lower()
        
        # Calculate ATS score
        score_result = scorer.calculate_ats_score(resume_text, job_desc)
        
        # Add file-type specific recommendations
        recommendations = generate_format_recommendations(file_type)
        score_result['recommendations'] = recommendations
        
        return jsonify(score_result)

    except Exception as e:
        print(f"Error in ATS scoring: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@ats_bp.route('/api/ats/batch-score', methods=['POST'])
def batch_score_resumes():
    """
    Score multiple resumes against a job description.
    
    Expected JSON body:
    {
        "resumes": [
            {
                "id": "resume_id",
                "content": "base64_encoded_resume_text",
                "fileType": "pdf" | "docx" | "txt" (optional)
            }
        ],
        "jobDescription": "base64_encoded_job_description"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'resumes' not in data or 'jobDescription' not in data:
            return jsonify({
                'error': 'Missing required fields: resumes and jobDescription'
            }), 400

        # Decode job description
        try:
            job_desc = base64.b64decode(data['jobDescription']).decode('utf-8')
        except:
            return jsonify({
                'error': 'Invalid base64 encoding for job description'
            }), 400

        # Score each resume
        results = []
        for resume in data['resumes']:
            try:
                resume_text = base64.b64decode(resume['content']).decode('utf-8')
                score = scorer.calculate_ats_score(resume_text, job_desc)
                
                # Add file-type specific recommendations
                file_type = resume.get('fileType', 'txt').lower()
                recommendations = generate_format_recommendations(file_type)
                score['recommendations'] = recommendations
                
                results.append({
                    'id': resume['id'],
                    'score': score
                })
            except Exception as e:
                results.append({
                    'id': resume['id'],
                    'error': str(e)
                })

        return jsonify({
            'results': results
        })

    except Exception as e:
        print(f"Error in batch ATS scoring: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@ats_bp.route('/api/ats/analyze-job', methods=['POST'])
def analyze_job_description():
    """
    Analyze a job description to extract key requirements and keywords.
    
    Expected JSON body:
    {
        "jobDescription": "base64_encoded_job_description"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'jobDescription' not in data:
            return jsonify({
                'error': 'Missing required field: jobDescription'
            }), 400

        # Decode job description
        try:
            job_desc = base64.b64decode(data['jobDescription']).decode('utf-8')
        except:
            return jsonify({
                'error': 'Invalid base64 encoding for job description'
            }), 400

        # Extract key information
        analysis = analyze_job_requirements(job_desc)
        return jsonify(analysis)

    except Exception as e:
        print(f"Error analyzing job description: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

def generate_format_recommendations(file_type: str) -> list:
    """Generate format-specific recommendations for resume improvement."""
    recommendations = {
        'pdf': [
            "Ensure PDF is searchable (not scanned)",
            "Use standard fonts that render well in PDF",
            "Keep file size under 2MB",
            "Avoid complex layouts that might break ATS parsing"
        ],
        'docx': [
            "Use standard Word formatting",
            "Avoid text boxes and tables",
            "Use standard section headers",
            "Keep formatting consistent throughout"
        ],
        'txt': [
            "Use clear section separators",
            "Maintain consistent indentation",
            "Use standard section headers",
            "Avoid special characters"
        ]
    }
    
    return recommendations.get(file_type, [
        "Use standard file formats (PDF, DOCX, or TXT)",
        "Keep formatting simple and consistent",
        "Use clear section headers"
    ])

def analyze_job_requirements(job_desc: str) -> dict:
    """Analyze job description to extract key requirements."""
    try:
        # Initialize empty response
        analysis = {
            'required_years': 0,
            'education_level': None,
            'key_skills': [],
            'preferred_skills': [],
            'required_certifications': [],
            'job_level': None,
            'keywords': []
        }
        
        # Extract years of experience
        years_pattern = r'(\d+)[\+]?\s*(?:years?|yrs?)(?:\s+of)?\s+experience'
        years_match = re.search(years_pattern, job_desc.lower())
        if years_match:
            analysis['required_years'] = int(years_match.group(1))

        # Extract education requirements
        education_patterns = {
            "PhD": r"ph\.?d\.?|doctorate",
            "Master's": r"master'?s|m\.?s\.?|m\.?e\.?|m\.?b\.?a\.?",
            "Bachelor's": r"bachelor'?s|b\.?s\.?|b\.?e\.?|b\.?a\.?",
            "Associate's": r"associate'?s|a\.?s\.?|a\.?a\.?"
        }
        
        for level, pattern in education_patterns.items():
            if re.search(pattern, job_desc.lower()):
                analysis['education_level'] = level
                break

        # Use TF-IDF to extract important keywords
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=20
        )
        
        try:
            tfidf_matrix = vectorizer.fit_transform([job_desc])
            feature_names = vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            
            # Get top keywords
            top_indices = scores.argsort()[-10:][::-1]
            analysis['keywords'] = [
                {
                    'term': feature_names[i],
                    'relevance': float(scores[i])
                }
                for i in top_indices
            ]
        except:
            analysis['keywords'] = []

        return analysis
        
    except Exception as e:
        print(f"Error analyzing job requirements: {e}")
        return {
            'error': 'Failed to analyze job requirements',
            'message': str(e)
        }
