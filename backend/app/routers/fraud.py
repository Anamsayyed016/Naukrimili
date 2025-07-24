from fastapi import APIRouter, UploadFile, HTTPException
from ..middleware.fraud import detect_fraud_upload

router = APIRouter()

@router.post("/check-fraud")
async def check_fraud(file: UploadFile):
    """
    Check if an uploaded file is potentially fraudulent
    
    Args:
        file: The uploaded file to check
        
    Returns:
        dict: Contains fraud detection results
        
    Raises:
        HTTPException: If fraud detection fails
    """
    try:
        is_fraudulent = detect_fraud_upload(file.file)
        
        if is_fraudulent is None:
            raise HTTPException(
                status_code=500,
                detail="Fraud detection analysis failed"
            )
            
        return {
            "is_fraudulent": is_fraudulent,
            "message": "Fraud check completed successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fraud detection failed: {str(e)}"
        ) 