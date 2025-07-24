from flask import Flask
from flask.testing import FlaskClient
import pytest
from app import app, db
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'

def test_get_jobs(client):
    response = client.get('/api/jobs')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)

def test_create_job_without_auth(client):
    response = client.post('/api/jobs', json={
        'title': 'Test Job',
        'company': 'Test Company',
        'location': 'Test Location'
    })
    assert response.status_code == 401  # Unauthorized

def test_login_invalid_credentials(client):
    response = client.post('/api/auth/login', json={
        'email': 'invalid@test.com',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data
