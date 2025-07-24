from flask import Blueprint
from .resume import resume_blueprint

# Register all blueprints
def init_api(app):
    """Initialize all API blueprints with the Flask app"""
    app.register_blueprint(resume_blueprint, url_prefix='/api/resume')
