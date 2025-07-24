from flask import Flask
from flask_cors import CORS
from app.api.ai import ai_blueprint
import os

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Register blueprints
    app.register_blueprint(ai_blueprint, url_prefix='/resume')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
