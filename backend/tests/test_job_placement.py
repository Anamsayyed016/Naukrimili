import sys
from app import create_app, db
from app.models.user import User, user_placed_job
from app.models.job import Job

def test_job_placement():
    """Test the job placement and affiliate payout system."""
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
                print(f"Updated wallet balance: {test_user.wallet_balance} INR")
            else:
                print("✗ Job placement or payout failed")
                
            # Verify payout in wallet
            user = User.get_user(test_user.id)
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
    test_job_placement()
