import pytest
from app.utils.ats import ATSScorer

@pytest.fixture
def ats_scorer():
    return ATSScorer()

@pytest.fixture
def sample_job_desc():
    return """
    Senior Software Engineer
    
    Requirements:
    - 5+ years of experience in Python development
    - Proficient in Django, Flask, and FastAPI
    - Experience with MongoDB and PostgreSQL
    - Knowledge of React and modern JavaScript
    - Strong problem-solving skills
    
    Responsibilities:
    - Develop and maintain web applications
    - Design and implement RESTful APIs
    - Mentor junior developers
    - Collaborate with cross-functional teams
    """

@pytest.fixture
def good_resume():
    return """
    Professional Summary
    Experienced software engineer with 7 years of expertise in web development.
    
    Experience
    Senior Developer, Tech Corp (2018-Present)
    - Led development of Python-based web applications using Django and Flask
    - Designed and implemented RESTful APIs with FastAPI
    - Mentored 5 junior developers
    
    Software Engineer, Dev Inc (2016-2018)
    - Developed full-stack applications using Python and React
    - Worked with MongoDB and PostgreSQL databases
    
    Skills
    - Python, Django, Flask, FastAPI
    - React, JavaScript, HTML, CSS
    - MongoDB, PostgreSQL
    - Team leadership and mentoring
    
    Education
    BS Computer Science, Tech University
    
    Contact
    email@example.com
    (123) 456-7890
    """

@pytest.fixture
def poor_resume():
    return """
    Summary
    Looking for a software development position.
    
    Experience
    Junior Developer (2022-Present)
    - Write code
    - Fix bugs
    
    Education
    Currently studying computer science
    """

def test_perfect_match(ats_scorer, sample_job_desc, good_resume):
    score = ats_scorer.calculate_ats_score(good_resume, sample_job_desc)
    assert score['total_score'] > 80
    assert all(component_score > 70 
              for component_score in score['component_scores'].values())

def test_poor_match(ats_scorer, sample_job_desc, poor_resume):
    score = ats_scorer.calculate_ats_score(poor_resume, sample_job_desc)
    assert score['total_score'] < 50
    assert any(component_score < 50 
              for component_score in score['component_scores'].values())

def test_keyword_matching(ats_scorer):
    job_desc = "Python developer with React experience"
    resume = "Experienced in Python and React development"
    score = ats_scorer._calculate_keyword_match(resume, job_desc)
    assert score > 70

def test_section_completeness(ats_scorer, good_resume):
    score = ats_scorer._check_section_completeness(good_resume)
    assert score == 100  # All required sections present

def test_missing_sections(ats_scorer, poor_resume):
    score = ats_scorer._check_section_completeness(poor_resume)
    assert score < 100  # Missing some required sections

def test_readability_scoring(ats_scorer):
    good_text = """
    Professional experience in software development.
    Led team of five developers.
    Implemented new features.
    """
    score = ats_scorer._calculate_readability(good_text)
    assert score > 70

def test_experience_alignment(ats_scorer):
    job_desc = "5 years of Python experience required"
    good_resume = "7 years of Python development experience"
    poor_resume = "1 year of Python experience"
    
    good_score = ats_scorer._calculate_experience_alignment(good_resume, job_desc)
    poor_score = ats_scorer._calculate_experience_alignment(poor_resume, job_desc)
    
    assert good_score > poor_score
    assert good_score > 80

def test_feedback_generation(ats_scorer, sample_job_desc, good_resume, poor_resume):
    good_score = ats_scorer.calculate_ats_score(good_resume, sample_job_desc)
    poor_score = ats_scorer.calculate_ats_score(poor_resume, sample_job_desc)
    
    assert len(good_score['feedback']) < len(poor_score['feedback'])
    assert any("well-optimized" in feedback 
              for feedback in good_score['feedback'])
    assert any("missing" in feedback or "improve" in feedback 
              for feedback in poor_score['feedback'])

def test_edge_cases(ats_scorer):
    # Empty inputs
    empty_score = ats_scorer.calculate_ats_score("", "")
    assert empty_score['total_score'] == 0
    
    # Very short inputs
    short_score = ats_scorer.calculate_ats_score("Python developer", "Need Python")
    assert 0 <= short_score['total_score'] <= 100
    
    # Very long input
    long_text = "Python developer " * 1000
    long_score = ats_scorer.calculate_ats_score(long_text, long_text)
    assert 0 <= long_score['total_score'] <= 100
