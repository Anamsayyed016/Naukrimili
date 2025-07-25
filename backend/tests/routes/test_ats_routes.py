import pytest
import base64
import json
from app import create_app
from app.utils.ats import ATSScorer

@pytest.fixture
def app():
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def sample_job_desc():
    return """
    Senior Software Engineer
    
    Requirements:
    - 5+ years of experience in Python development
    - Proficient in Django, Flask, and FastAPI
    - Experience with MongoDB and PostgreSQL
    - Knowledge of React and modern JavaScript
    """

@pytest.fixture
def sample_resume():
    return """
    Senior Python Developer
    
    Experience:
    - 7 years of Python development
    - Built applications using Django and Flask
    - Extensive MongoDB and PostgreSQL experience
    - React and JavaScript expert
    """

def encode_base64(text):
    return base64.b64encode(text.encode('utf-8')).decode('utf-8')

def test_score_resume(client, sample_job_desc, sample_resume):
    response = client.post('/api/ats/score', json={
        'resume': encode_base64(sample_resume),
        'jobDescription': encode_base64(sample_job_desc),
        'fileType': 'pdf'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'total_score' in data
    assert 'component_scores' in data
    assert 'feedback' in data
    assert 'recommendations' in data
    
    assert data['total_score'] > 70  # Good match should score high

def test_invalid_base64(client):
    response = client.post('/api/ats/score', json={
        'resume': 'invalid-base64',
        'jobDescription': 'invalid-base64'
    })
    
    assert response.status_code == 400
    assert b'Invalid base64 encoding' in response.data

def test_missing_fields(client):
    response = client.post('/api/ats/score', json={
        'resume': encode_base64('test')
    })
    
    assert response.status_code == 400
    assert b'Missing required fields' in response.data

def test_batch_score(client, sample_job_desc, sample_resume):
    response = client.post('/api/ats/batch-score', json={
        'resumes': [
            {
                'id': '1',
                'content': encode_base64(sample_resume),
                'fileType': 'pdf'
            },
            {
                'id': '2',
                'content': encode_base64('Junior developer'),
                'fileType': 'docx'
            }
        ],
        'jobDescription': encode_base64(sample_job_desc)
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'results' in data
    assert len(data['results']) == 2
    assert data['results'][0]['score']['total_score'] > data['results'][1]['score']['total_score']

def test_analyze_job(client, sample_job_desc):
    response = client.post('/api/ats/analyze-job', json={
        'jobDescription': encode_base64(sample_job_desc)
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'required_years' in data
    assert data['required_years'] == 5
    assert 'key_skills' in data
    assert 'keywords' in data

def test_format_recommendations(client, sample_job_desc, sample_resume):
    # Test PDF recommendations
    response = client.post('/api/ats/score', json={
        'resume': encode_base64(sample_resume),
        'jobDescription': encode_base64(sample_job_desc),
        'fileType': 'pdf'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert any('PDF' in rec for rec in data['recommendations'])
    
    # Test DOCX recommendations
    response = client.post('/api/ats/score', json={
        'resume': encode_base64(sample_resume),
        'jobDescription': encode_base64(sample_job_desc),
        'fileType': 'docx'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert any('Word' in rec for rec in data['recommendations'])
