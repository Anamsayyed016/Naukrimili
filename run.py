import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from flask import Flask
from flask_cors import CORS
from backend.app.api.ai import ai_blueprint
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Register blueprints
    app.register_blueprint(ai_blueprint)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
