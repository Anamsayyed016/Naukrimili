import requests
import json

def test_resume_generation():
    url = "http://localhost:5000/resume/ai-generate"
    
    data = {
        "linkedin_url": "https://linkedin.com/in/test",
        "job_target": "Software Engineer",
        "years_of_experience": "5"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the Flask server is running.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_resume_generation()
