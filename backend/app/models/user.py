from typing import Optional
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    experience_years = db.Column(db.Integer, default=0)
    premium = db.Column(db.Integer, default=0)  # Premium level
    wallet_balance = db.Column(db.Float, default=0.0)
    
    def __init__(self, name: str, email: str, experience_years: int = 0, premium: int = 0):
        self.name = name
        self.email = email
        self.experience_years = experience_years
        self.premium = premium
        
    def add_to_wallet(self, amount: float) -> bool:
        """Add amount to user's wallet.
        
        Args:
            amount (float): Amount to add in INR
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.wallet_balance += amount
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
            
    @staticmethod
    def get_user(user_id: int) -> Optional['User']:
        """Get user by ID.
        
        Args:
            user_id (int): User ID to look up
            
        Returns:
            Optional[User]: User object if found, None otherwise
        """
        return User.query.get(user_id)

class JobPlacement(db.Model):
    __tablename__ = 'job_placements'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    placed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    payout_processed = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref=db.backref('placements', lazy=True))
    
    def __init__(self, user_id: int, job_id: int):
        self.user_id = user_id
        self.job_id = job_id
        
    def mark_payout_processed(self) -> bool:
        """Mark this placement as having processed payout.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.payout_processed = True
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False

def user_placed_job(user_id: int, job_id: int) -> bool:
    """Record a job placement and process affiliate payout if eligible.
    
    Args:
        user_id (int): ID of the user who placed the job
        job_id (int): ID of the job that was placed
        
    Returns:
        bool: True if placement was recorded and payout processed successfully
    """
    try:
        # Create placement record
        placement = JobPlacement(user_id=user_id, job_id=job_id)
        db.session.add(placement)
        db.session.flush()  # Get placement ID without committing
        
        # Get user data
        user = User.get_user(user_id)
        if not user:
            db.session.rollback()
            return False
            
        # Process payout
        user_data = {
            'premium': user.premium,
            'experience_years': user.experience_years
        }
        
        # Import here to avoid circular imports
        from ..affiliate import calculate_payout
        payout_amount = calculate_payout(user_data)
        
        # Add payout to user's wallet
        if user.add_to_wallet(payout_amount):
            placement.mark_payout_processed()
            db.session.commit()
            return True
            
        db.session.rollback()
        return False
        
    except Exception:
        db.session.rollback()
        return False
