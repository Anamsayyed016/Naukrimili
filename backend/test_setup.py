import os
import requests
from dotenv import load_dotenv

def test_setup():
    # Load environment variables
    load_dotenv()
    
    # Check if API key is present
    api_key = os.getenv('OPENAI_API_KEY')
    print(f"API Key present: {bool(api_key)}")
    
    # Test the API configuration endpoint
    try:
        response = requests.get('http://localhost:5000/resume/test')
        print(f"Status Code: {response.status_code}")
        print("Response:", response.json())
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the Flask server is running.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_setup()
