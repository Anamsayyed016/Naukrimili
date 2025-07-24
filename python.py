from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "your-secret-key")
jwt = JWTManager(app)

# MongoDB Connection
mongo_uri = os.getenv("MONGO_URI", "mongodb+srv://naukrimili123:naukrimili123@naukrimili.lb6ad5e.mongodb.net/")
client = MongoClient(mongo_uri)
db = client["job_portal_dynamic"]

@app.route('/')
def home():
    return "Job Portal API is running!"

@app.route('/api/db-health')
def db_health():
    try:
        # List all collections to test the connection
        db.list_collection_names()
        return jsonify({
            "status": "ok",
            "message": "Connected to MongoDB successfully!"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)