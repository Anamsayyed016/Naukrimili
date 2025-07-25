from typing import Dict, List, Tuple, Optional
import os
import hashlib
import PyPDF2
from PIL import Image
import imagehash
import pytesseract
from sklearn.feature_extraction.text import TfidfVectorizer
import fitz  # PyMuPDF
import docx
import magic  # python-magic
from datetime import datetime
import re
from collections import Counter
import cv2
import numpy as np

class FraudDetector:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.known_hashes = set()  # Could be replaced with database lookup
        self.suspicious_patterns = [
            r'\b(salary|compensation|current)\s*:\s*[\d,]+',
            r'\b(fake|template|sample)\s+resume\b',
            r'\bconfidential\b.*\bdo\s+not\s+distribute\b',
        ]

    def check_resume_fraud(self, file_path: str, content_text: Optional[str] = None) -> Dict:
        """
        Analyze a resume file for potential fraud indicators.
        
        Args:
            file_path: Path to the resume file
            content_text: Optional pre-extracted text content
            
        Returns:
            Dictionary containing fraud analysis results and probability score
        """
        try:
            results = {
                'score': 0.0,
                'flags': [],
                'metadata_issues': [],
                'content_issues': [],
                'image_issues': [],
                'plagiarism_score': 0.0
            }
            
            # Get file type
            mime_type = magic.from_file(file_path, mime=True)
            
            # 1. Metadata Analysis
            metadata_score = self._analyze_metadata(file_path, mime_type)
            results['score'] += metadata_score * 0.3  # 30% weight
            
            # 2. Content Analysis
            if not content_text:
                content_text = self._extract_text(file_path, mime_type)
            content_score = self._analyze_content(content_text)
            results['score'] += content_score * 0.4  # 40% weight
            
            # 3. Image Analysis
            image_score = self._analyze_images(file_path, mime_type)
            results['score'] += image_score * 0.15  # 15% weight
            
            # 4. Plagiarism Check
            plagiarism_score = self._check_plagiarism(content_text)
            results['score'] += plagiarism_score * 0.15  # 15% weight
            results['plagiarism_score'] = plagiarism_score
            
            # Normalize final score to 0-100 range
            results['score'] = min(100, max(0, results['score'] * 100))
            
            # Add risk level
            results['risk_level'] = self._determine_risk_level(results['score'])
            
            return results
            
        except Exception as e:
            print(f"Error in fraud detection: {e}")
            return {
                'score': 0.0,
                'error': str(e),
                'risk_level': 'unknown'
            }

    def _analyze_metadata(self, file_path: str, mime_type: str) -> float:
        """Analyze document metadata for suspicious patterns."""
        suspicion_score = 0.0
        
        try:
            # Get file creation and modification times
            stats = os.stat(file_path)
            created = datetime.fromtimestamp(stats.st_ctime)
            modified = datetime.fromtimestamp(stats.st_mtime)
            
            # Check for suspicious time patterns
            if (modified - created).seconds < 300:  # Less than 5 minutes
                suspicion_score += 0.2
                
            if mime_type == 'application/pdf':
                with open(file_path, 'rb') as file:
                    pdf = PyPDF2.PdfReader(file)
                    info = pdf.metadata
                    
                    if info:
                        # Check for template software markers
                        producer = info.get('/Producer', '').lower()
                        creator = info.get('/Creator', '').lower()
                        
                        suspicious_tools = ['resume builder', 'template', 'faker']
                        for tool in suspicious_tools:
                            if tool in producer or tool in creator:
                                suspicion_score += 0.15
                                
            elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                doc = docx.Document(file_path)
                core_props = doc.core_properties
                
                # Check revision count
                if core_props.revision < 2:  # Too few revisions might indicate a template
                    suspicion_score += 0.1
                    
        except Exception as e:
            print(f"Metadata analysis error: {e}")
            
        return min(1.0, suspicion_score)

    def _analyze_content(self, text: str) -> float:
        """Analyze resume content for suspicious patterns."""
        suspicion_score = 0.0
        
        try:
            # Check for suspicious patterns
            for pattern in self.suspicious_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    suspicion_score += 0.2
            
            # Check for inconsistent dates
            dates = self._extract_dates(text)
            if self._check_date_consistency(dates):
                suspicion_score += 0.15
            
            # Check for unrealistic claims
            if self._check_unrealistic_claims(text):
                suspicion_score += 0.25
            
            # Statistical analysis
            stats = self._analyze_text_statistics(text)
            if stats['suspicious']:
                suspicion_score += 0.2
                
        except Exception as e:
            print(f"Content analysis error: {e}")
            
        return min(1.0, suspicion_score)

    def _analyze_images(self, file_path: str, mime_type: str) -> float:
        """Analyze images in the document for manipulation."""
        suspicion_score = 0.0
        
        try:
            if mime_type == 'application/pdf':
                doc = fitz.open(file_path)
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    image_list = page.get_images()
                    
                    for img_index, img in enumerate(image_list):
                        xref = img[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        
                        # Convert to PIL Image
                        image = Image.open(io.BytesIO(image_bytes))
                        
                        # Generate image hash
                        img_hash = str(imagehash.average_hash(image))
                        
                        # Check for duplicate images
                        if img_hash in self.known_hashes:
                            suspicion_score += 0.3
                        
                        # Check for manipulation
                        if self._check_image_manipulation(image):
                            suspicion_score += 0.2
                            
        except Exception as e:
            print(f"Image analysis error: {e}")
            
        return min(1.0, suspicion_score)

    def _check_plagiarism(self, text: str) -> float:
        """Check for plagiarism using text similarity."""
        try:
            # Transform text to TF-IDF vector
            text_vector = self.vectorizer.fit_transform([text])
            
            # Here you would normally compare against a database of known resumes
            # For demonstration, we're using a simplified check
            suspicious_phrases = [
                "results-driven professional",
                "track record of success",
                "proven ability to",
                "strong communication skills"
            ]
            
            phrase_count = sum(1 for phrase in suspicious_phrases 
                             if phrase in text.lower())
            
            return min(1.0, phrase_count / len(suspicious_phrases))
            
        except Exception as e:
            print(f"Plagiarism check error: {e}")
            return 0.0

    def _extract_dates(self, text: str) -> List[datetime]:
        """Extract dates from text."""
        date_patterns = [
            r'\b\d{4}\b',  # Year
            r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b',
            r'\b\d{1,2}/\d{1,2}/\d{4}\b'
        ]
        
        dates = []
        for pattern in date_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                try:
                    # Convert to datetime object (simplified)
                    dates.append(datetime.strptime(match.group(), '%Y'))
                except:
                    continue
                    
        return sorted(dates)

    def _check_date_consistency(self, dates: List[datetime]) -> bool:
        """Check for inconsistencies in dates."""
        if not dates:
            return False
            
        # Check for future dates
        if max(dates) > datetime.now():
            return True
            
        # Check for impossible experience duration
        if len(dates) >= 2:
            experience_years = (max(dates) - min(dates)).days / 365
            if experience_years > 50:  # Unrealistic work experience
                return True
                
        return False

    def _check_unrealistic_claims(self, text: str) -> bool:
        """Check for unrealistic claims in resume."""
        suspicious_claims = [
            r'\b(increased|improved|grew).{0,30}\b(1000|[2-9][0-9][0-9])\s*%',
            r'\bmanaged\s+[0-9]{4,}\s+people\b',
            r'\b(billion|million)\s+dollar\s+project\b'
        ]
        
        return any(re.search(pattern, text, re.IGNORECASE) 
                  for pattern in suspicious_claims)

    def _analyze_text_statistics(self, text: str) -> Dict:
        """Analyze text statistics for suspicious patterns."""
        words = text.lower().split()
        word_count = len(words)
        unique_words = len(set(words))
        
        # Calculate vocabulary diversity
        diversity_ratio = unique_words / word_count if word_count > 0 else 0
        
        # Check word frequency distribution
        word_freq = Counter(words)
        most_common = word_freq.most_common(5)
        
        return {
            'suspicious': (
                diversity_ratio < 0.3 or  # Too repetitive
                diversity_ratio > 0.9 or  # Too diverse (might be generated)
                word_count < 100  # Too short
            ),
            'stats': {
                'word_count': word_count,
                'unique_words': unique_words,
                'diversity_ratio': diversity_ratio,
                'most_common': most_common
            }
        }

    def _check_image_manipulation(self, image: Image) -> bool:
        """Check if an image shows signs of manipulation."""
        try:
            # Convert PIL image to OpenCV format
            img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            
            # Error Level Analysis
            ela_score = self._error_level_analysis(image)
            
            # Edge detection
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
            
            return ela_score > 40 or edge_density > 0.5
            
        except Exception as e:
            print(f"Image manipulation check error: {e}")
            return False

    def _error_level_analysis(self, image: Image, quality: int = 90) -> float:
        """Perform Error Level Analysis on image."""
        try:
            # Save image with specified quality
            temp_file = "temp.jpg"
            image.save(temp_file, "JPEG", quality=quality)
            
            # Open saved image
            saved_image = Image.open(temp_file)
            
            # Calculate difference
            diff = ImageChops.difference(image, saved_image)
            
            # Calculate mean difference
            diff_array = np.array(diff)
            mean_diff = np.mean(diff_array)
            
            # Cleanup
            os.remove(temp_file)
            
            return mean_diff
            
        except Exception as e:
            print(f"ELA analysis error: {e}")
            return 0.0

    def _determine_risk_level(self, score: float) -> str:
        """Determine risk level based on fraud score."""
        if score >= 80:
            return 'critical'
        elif score >= 60:
            return 'high'
        elif score >= 40:
            return 'medium'
        elif score >= 20:
            return 'low'
        else:
            return 'minimal'

# Example usage:
"""
detector = FraudDetector()
result = detector.check_resume_fraud('path/to/resume.pdf')
print(f"Fraud Score: {result['score']}")
print(f"Risk Level: {result['risk_level']}")
print("Flags:", result['flags'])
print("Plagiarism Score:", result['plagiarism_score'])
"""
