from flask import Blueprint, jsonify
from flask import current_app as app

db_health_bp = Blueprint('db_health', __name__)

@db_health_bp.route('/api/db-health')
def db_health():
    try:
        db = app.config['db'] if 'db' in app.config else app.mongo.db
        db.list_collection_names()
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"status": "error", "details": str(e)}), 500
