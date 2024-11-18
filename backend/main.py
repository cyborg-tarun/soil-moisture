from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this to restrict access in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data store for sensor values and device states
data_store = {
    "moisture": 0.0,  # Default moisture value
    "led_status": 0 ,  # LED status: 0 (OFF), 1 (ON)
    "mode": "manual"  # Default to manual mode
}

# Pydantic models for request bodies
class MoistureData(BaseModel):
    moisture: float  # Moisture value as a percentage (0-100)

class LEDStatusData(BaseModel):
    led_status: int  # LED status: 0 (OFF), 1 (ON)

# Route to update soil moisture value
@app.post("/update_moisture", tags=["Soil Sensor"])
async def update_moisture(data: MoistureData):
    """
    Update the soil moisture value.
    """
    if not (0 <= data.moisture <= 100):
        raise HTTPException(status_code=400, detail="Moisture value must be between 0 and 100")
    
    data_store["moisture"] = data.moisture
    return {"message": "Moisture data updated successfully"}

# Route to retrieve the current soil moisture value
@app.get("/get_moisture", tags=["Soil Sensor"])
async def get_moisture():
    """
    Get the current soil moisture value.
    """
    return {"moisture": data_store["moisture"]}

# Route to set the LED status
@app.post("/set_led_status", tags=["LED Control"])
async def set_led_status(data: LEDStatusData):
    """
    Update the LED status.
    0 = OFF, 1 = ON
    """
    if data.led_status not in [0, 1]:
        raise HTTPException(status_code=400, detail="Invalid LED status. Use 0 for OFF and 1 for ON.")
    
    data_store["led_status"] = data.led_status
    return {"message": f"LED status set to {'ON' if data.led_status == 1 else 'OFF'}"}

# Route to retrieve the current LED status
@app.get("/get_led_status", tags=["LED Control"])
async def get_led_status():
    """
    Get the current LED status.
    """
    led_status = "ON" if data_store["led_status"] == 1 else "OFF"
    return {"led_status": led_status}



# Route to set mode (manual or automatic)
@app.post("/set_mode")
async def set_mode(data: dict):
    mode = data.get("mode", "manual")
    if mode not in ["manual", "automatic"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'manual' or 'automatic'.")
    
    data_store["mode"] = mode
    return {"message": f"Mode set to {mode}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
