import pytest
from unittest.mock import Mock, patch
from app.utils.job_filters import (
    get_nearby_jobs,
    format_job_location,
    get_location_stats,
    setup_geo_indexes
)

@pytest.fixture
def mock_db():
    with patch('app.utils.job_filters.db') as mock:
        yield mock

def test_get_nearby_jobs(mock_db):
    # Test data
    user_coords = (72.8777, 19.0760)  # Mumbai coordinates
    mock_jobs = [
        {
            "_id": "1",
            "title": "Software Engineer",
            "company": "TechCorp",
            "location": {
                "type": "Point",
                "coordinates": [72.8777, 19.0760]
            },
            "distance": 0
        }
    ]
    
    # Setup mock
    mock_db.jobs.find.return_value = mock_jobs
    
    # Test basic search
    jobs = get_nearby_jobs(user_coords)
    assert len(jobs) == 1
    assert jobs[0]["title"] == "Software Engineer"
    
    # Test with filters
    filters = {
        "salary": [500000, 1500000],
        "jobType": "Full Time"
    }
    jobs = get_nearby_jobs(user_coords, filters=filters)
    assert len(jobs) == 1

def test_format_job_location():
    lat, lon = 19.0760, 72.8777
    address = "Mumbai, Maharashtra"
    
    # Test with address
    location = format_job_location(lat, lon, address)
    assert location["type"] == "Point"
    assert location["coordinates"] == [lon, lat]
    assert location["address"] == address
    
    # Test without address
    location = format_job_location(lat, lon)
    assert "address" not in location

def test_get_location_stats(mock_db):
    # Test data
    mock_stats = [{
        "totalJobs": 100,
        "avgSalary": 750000,
        "companies": ["TechCorp", "InfoSys"],
        "jobTypes": ["Full Time", "Contract"]
    }]
    
    # Setup mock
    mock_db.jobs.aggregate.return_value = mock_stats
    
    # Test stats
    location = (72.8777, 19.0760)
    stats = get_location_stats(location)
    
    assert stats["totalJobs"] == 100
    assert stats["avgSalary"] == 750000
    assert stats["uniqueCompanies"] == 2
    assert len(stats["jobTypes"]) == 2

def test_get_location_stats_empty(mock_db):
    # Setup mock to return empty results
    mock_db.jobs.aggregate.return_value = []
    
    # Test empty stats
    location = (72.8777, 19.0760)
    stats = get_location_stats(location)
    
    assert stats["totalJobs"] == 0
    assert stats["avgSalary"] == 0
    assert stats["uniqueCompanies"] == 0
    assert len(stats["jobTypes"]) == 0

def test_setup_geo_indexes(mock_db):
    setup_geo_indexes()
    mock_db.jobs.create_index.assert_called_once()
