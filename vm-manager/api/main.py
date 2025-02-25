import sys
import os

# Print Python environment info for debugging
print(f"Python version: {sys.version}")
print(f"Python path: {sys.executable}")
print(f"Virtual env: {os.environ.get('VIRTUAL_ENV', 'Not in virtualenv')}")

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    import psutil
    import uvicorn
    from typing import Dict, List
    import time
    from collections import deque
    from datetime import datetime, timedelta
except ImportError as e:
    print(f"Failed to import required packages: {e}")
    print("Please ensure all requirements are installed:")
    print("pip install -r requirements.txt")
    sys.exit(1)

app = FastAPI(
    title="VM Manager API",
    description="API for managing virtual machines and monitoring system resources",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI endpoint
    redoc_url="/redoc",  # ReDoc endpoint
)

# Allow CORS - expanded for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5273",  # Alternative port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5273",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add a simple health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}


# Constants
MAX_HISTORY_MINUTES = 30
HISTORY_INTERVAL_SECONDS = 15  # Store data every 15 seconds
MAX_SAMPLES = (MAX_HISTORY_MINUTES * 60) // HISTORY_INTERVAL_SECONDS

# Initialize deques for historical data
cpu_history = deque(maxlen=MAX_SAMPLES)
memory_history = deque(maxlen=MAX_SAMPLES)
disk_history = deque(maxlen=MAX_SAMPLES)

last_update_time = 0


def should_update_history() -> bool:
    global last_update_time
    current_time = time.time()
    if current_time - last_update_time >= HISTORY_INTERVAL_SECONDS:
        last_update_time = current_time
        return True
    return False


def add_to_history():
    timestamp = datetime.now().isoformat()

    # CPU metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_history.append({"timestamp": timestamp, "usage": cpu_percent})

    # Memory metrics
    memory = psutil.virtual_memory()
    memory_history.append({"timestamp": timestamp, "usage": memory.percent})

    # Disk metrics
    disk = psutil.disk_usage("/")
    disk_history.append({"timestamp": timestamp, "usage": disk.percent})


@app.get("/metrics")
async def get_metrics() -> Dict:
    try:
        if should_update_history():
            add_to_history()

        # Get current metrics
        cpu_freq = psutil.cpu_freq()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        return {
            "cpu": {
                "usage_percent": cpu_history[-1]["usage"] if cpu_history else 0,
                "frequency_mhz": cpu_freq.current if cpu_freq else None,
                "cores": psutil.cpu_count(),
                "history": list(cpu_history),
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory_history[-1]["usage"] if memory_history else 0,
                "used": memory.used,
                "history": list(memory_history),
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk_history[-1]["usage"] if disk_history else 0,
                "history": list(disk_history),
            },
            "timestamp": time.time(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("Starting FastAPI server...")
    print("Swagger UI will be available at: http://localhost:8000/docs")
    print("ReDoc will be available at: http://localhost:8000/redoc")
    print("Health check endpoint: http://localhost:8000/health")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
