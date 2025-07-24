from flask import Flask
from app.api.resume import resume_blueprint
import os

app = Flask(__name__)
app.register_blueprint(resume_blueprint, url_prefix='/api/resume')

if __name__ == '__main__':
    os.environ['FLASK_ENV'] = 'development'  # Suppress .env loading
    app.run(debug=True, port=5000, load_dotenv=False)
