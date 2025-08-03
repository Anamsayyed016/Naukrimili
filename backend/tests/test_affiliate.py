import os
import sys
import pytest
from app import create_app, db
from app.models import User

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def user(app):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    experience_years = db.Column(db.Integer, default=0)
    premium = db.Column(db.Integer, default=0)
    wallet_balance = db.Column(db.Float, default=0.0)

class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(100), nullable=False)

class JobPlacement(db.Model):
    __tablename__ = 'job_placements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    payout_processed = db.Column(db.Boolean, default=False)

def calculate_payout(user_data):
    """Calculate affiliate payout based on user profile."""
    base = 100  # INR
    bonus = user_data['premium'] * 50
    experience_multiplier = 1 + (user_data['experience_years'] * 0.1)
    return (base + bonus) * experience_multiplier

def user_placed_job(user_id, job_id):
    """Record a job placement and process affiliate payout."""
    try:
        # Create placement record
        placement = JobPlacement(user_id=user_id, job_id=job_id)
        db.session.add(placement)
        db.session.flush()
        
        # Get user data
        user = User.query.get(user_id)
        if not user:
            db.session.rollback()
            return False
        
        # Calculate and process payout
        user_data = {
            'premium': user.premium,
            'experience_years': user.experience_years
        }
        payout_amount = calculate_payout(user_data)
        
        # Update wallet
        user.wallet_balance += payout_amount
        placement.payout_processed = True
        
        db.session.commit()
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        db.session.rollback()
        return False

def main():
    """Test the job placement and affiliate payout system."""
    with app.app_context():
        try:
            # Create tables
            db.create_all()
            
            # Create test user
            test_user = User(
                name="Test User",
                email="test@example.com",
                experience_years=3,
                premium=1
            )
            db.session.add(test_user)
            
            # Create test job
            test_job = Job(
                title="Senior Software Engineer",
                company="TechCorp Inc."
            )
            db.session.add(test_job)
            
            db.session.commit()
            print(f"Created test user with ID: {test_user.id}")
            print(f"Created test job with ID: {test_job.id}")
            
            # Test job placement
            success = user_placed_job(user_id=test_user.id, job_id=test_job.id)
            if success:
                print("✓ Job placement recorded and payout processed!")
                user = User.query.get(test_user.id)
                print(f"Updated wallet balance: {user.wallet_balance} INR")
            else:
                print("✗ Job placement or payout failed")
                
            # Verify payout in wallet
            user = User.query.get(test_user.id)
            if user and user.wallet_balance > 0:
                print(f"✓ Wallet balance verified: {user.wallet_balance} INR")
            else:
                print("✗ Wallet balance verification failed")
                
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            sys.exit(1)
        finally:
            # Clean up
            db.session.remove()
            db.drop_all()
            
if __name__ == '__main__':
    main()
