import pytest
from pydantic import ValidationError
from backend.models.user import User, UserRole

def test_user_role_enum():
    assert UserRole.SEEKER == "jobseeker"
    assert UserRole.EMPLOYER == "employer"
    assert UserRole.ADMIN == "admin"

def test_user_model_valid():
    user = User(email="test@example.com", password="secret", role=UserRole.SEEKER)
    assert user.email == "test@example.com"
    assert user.password == "secret"
    assert user.role == UserRole.SEEKER
    assert user.is_verified is False

def test_user_model_invalid_role():
    with pytest.raises(ValidationError):
        User(email="test@example.com", password="secret", role="invalidrole")

def test_user_model_verified_flag():
    user = User(email="test@example.com", password="secret", role=UserRole.ADMIN, is_verified=True)
    assert user.is_verified is True 