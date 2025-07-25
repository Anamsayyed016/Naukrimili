import pytest
from app.utils.fraud import FraudDetector
import os
from PIL import Image
import PyPDF2
import docx
from datetime import datetime
import io

@pytest.fixture
def fraud_detector():
    return FraudDetector()

@pytest.fixture
def sample_text_clean():
    return """
    John Smith
    Software Engineer
    
    Experience:
    Senior Developer, Tech Corp (2020-2023)
    - Led development of enterprise applications
    - Managed team of 5 developers
    - Implemented CI/CD pipeline
    
    Education:
    BS Computer Science, State University (2016-2020)
    
    Skills:
    Python, JavaScript, React, Docker
    """

@pytest.fixture
def sample_text_suspicious():
    return """
    CONFIDENTIAL - DO NOT DISTRIBUTE
    
    John Smith
    10X Software Engineer
    
    Experience:
    Senior Developer, Tech Corp (2010-2023)
    - Increased company revenue by 2000%
    - Managed team of 5000 developers
    - Led billion dollar projects
    
    Current Salary: $500,000
    
    Template from ResumeBuilder Pro
    """

def create_test_pdf(content, created_date=None):
    pdf_path = "test_resume.pdf"
    
    # Create PDF
    pdf_writer = PyPDF2.PdfWriter()
    pdf_writer.add_page(PyPDF2.PageObject.create_blank_page(width=612, height=792))
    
    # Add metadata
    pdf_writer.add_metadata({
        '/Creator': 'Test Creator',
        '/Producer': 'Test Producer',
        '/CreationDate': created_date or datetime.now().strftime('D:%Y%m%d%H%M%S')
    })
    
    # Save PDF
    with open(pdf_path, 'wb') as f:
        pdf_writer.write(f)
    
    return pdf_path

def test_clean_resume(fraud_detector, sample_text_clean):
    # Create test PDF
    pdf_path = create_test_pdf(sample_text_clean)
    
    try:
        result = fraud_detector.check_resume_fraud(pdf_path)
        
        assert result['score'] < 30
        assert result['risk_level'] in ['minimal', 'low']
        assert len(result['flags']) == 0
        assert result['plagiarism_score'] < 0.3
        
    finally:
        # Cleanup
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

def test_suspicious_resume(fraud_detector, sample_text_suspicious):
    # Create test PDF with suspicious metadata
    pdf_path = create_test_pdf(
        sample_text_suspicious,
        created_date='D:20230101000000'
    )
    
    try:
        result = fraud_detector.check_resume_fraud(pdf_path)
        
        assert result['score'] > 60
        assert result['risk_level'] in ['high', 'critical']
        assert len(result['flags']) > 0
        assert result['plagiarism_score'] > 0.5
        
    finally:
        # Cleanup
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

def test_metadata_analysis(fraud_detector):
    # Test recently modified file
    pdf_path = create_test_pdf("Test content")
    
    try:
        result = fraud_detector.check_resume_fraud(pdf_path)
        assert 'metadata_issues' in result
        
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

def test_content_analysis(fraud_detector):
    # Test unrealistic claims
    text = "Increased company revenue by 5000% in 3 months"
    score = fraud_detector._analyze_content(text)
    assert score > 0.5
    
    # Test date inconsistency
    text = "Experience: 1990-2030"
    score = fraud_detector._analyze_content(text)
    assert score > 0.5
    
    # Test suspicious patterns
    text = "TEMPLATE RESUME - DO NOT USE"
    score = fraud_detector._analyze_content(text)
    assert score > 0.5

def test_image_analysis(fraud_detector):
    # Create test image
    img = Image.new('RGB', (100, 100), color='white')
    img_path = "test_image.jpg"
    img.save(img_path)
    
    try:
        # Test basic image
        score = fraud_detector._analyze_images(img_path, 'image/jpeg')
        assert 0 <= score <= 1
        
    finally:
        if os.path.exists(img_path):
            os.remove(img_path)

def test_plagiarism_check(fraud_detector):
    # Test unique content
    unique_text = "This is a completely unique description of my work experience"
    score = fraud_detector._check_plagiarism(unique_text)
    assert score < 0.3
    
    # Test common phrases
    common_text = "Results-driven professional with a track record of success"
    score = fraud_detector._check_plagiarism(common_text)
    assert score > 0.5

def test_edge_cases(fraud_detector):
    # Test empty file
    pdf_path = create_test_pdf("")
    
    try:
        result = fraud_detector.check_resume_fraud(pdf_path)
        assert result['score'] >= 0
        assert result['score'] <= 100
        
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
    
    # Test very large content
    large_text = "test " * 10000
    score = fraud_detector._analyze_content(large_text)
    assert 0 <= score <= 1

def test_risk_level_determination(fraud_detector):
    assert fraud_detector._determine_risk_level(90) == 'critical'
    assert fraud_detector._determine_risk_level(70) == 'high'
    assert fraud_detector._determine_risk_level(50) == 'medium'
    assert fraud_detector._determine_risk_level(30) == 'low'
    assert fraud_detector._determine_risk_level(10) == 'minimal'
