import sys
import os
import subprocess
import json
import time
from collections import deque
from datetime import datetime, timedelta
import functools
import asyncio

# Import the logger first
from logger_config import logger

# Log Python environment info for debugging
logger.info(f"Python version: {sys.version}")
logger.info(f"Python path: {sys.executable}")
logger.info(f"Virtual env: {os.environ.get('VIRTUAL_ENV', 'Not in virtualenv')}")

# Add these imports
from typing import Dict, List, Optional, Any

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    import psutil
    import uvicorn
    import docker

    logger.info("Successfully imported required packages")
except ImportError as e:
    logger.error(f"Failed to import required packages: {e}", exc_info=True)
    logger.info("Please ensure all requirements are installed:")
    logger.info("pip install -r requirements.txt")
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


def get_docker_usage() -> Dict[str, float]:
    """Get resource usage by Docker containers"""
    try:
        client = docker.from_env()
        containers = client.containers.list()

        total_cpu = 0
        total_mem = 0
        total_disk = 0

        for container in containers:
            stats = container.stats(stream=False)

            # Extract CPU usage (approximate calculation)
            cpu_delta = (
                stats["cpu_stats"]["cpu_usage"]["total_usage"]
                - stats["precpu_stats"]["cpu_usage"]["total_usage"]
            )
            system_delta = (
                stats["cpu_stats"]["system_cpu_usage"]
                - stats["precpu_stats"]["system_cpu_usage"]
            )
            num_cpus = len(stats["cpu_stats"]["cpu_usage"]["percpu_usage"])
            cpu_percent = (cpu_delta / system_delta) * num_cpus * 100.0
            total_cpu += cpu_percent

            # Extract memory usage
            mem_usage = (
                stats["memory_stats"]["usage"] / stats["memory_stats"]["limit"] * 100.0
            )
            total_mem += mem_usage

            # For disk, we'll use an approximation based on the container size
            # This is not very accurate but gives a rough estimate
            total_disk += 0.1  # Placeholder

        return {
            "cpu": min(total_cpu, 100),  # Cap at 100%
            "memory": min(total_mem, 100),
            "storage": min(total_disk, 100),
        }
    except Exception as e:
        logger.error(f"Error getting Docker stats: {e}", exc_info=True)
        # Return default values on error
        return {"cpu": 0, "memory": 0, "storage": 0}


def get_vm_usage() -> Dict[str, float]:
    """Get resource usage by VMs using virsh if available"""
    try:
        # Check if libvirt/virsh is available
        result = subprocess.run(
            ["which", "virsh"], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        if result.returncode != 0:
            return {"cpu": 0, "memory": 0, "storage": 0}

        # Get list of VMs
        vm_list_result = subprocess.run(
            ["virsh", "list", "--all"], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        vm_list = (
            vm_list_result.stdout.decode().strip().split("\n")[2:]
        )  # Skip header lines

        total_cpu = 0
        total_mem = 0
        total_disk = 0

        for vm_line in vm_list:
            if not vm_line.strip():
                continue

            parts = vm_line.split()
            if len(parts) < 3:
                continue

            vm_name = parts[1]
            vm_state = parts[2]

            if vm_state.lower() == "running":
                # Get VM stats
                dominfo_result = subprocess.run(
                    ["virsh", "dominfo", vm_name],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                dominfo = dominfo_result.stdout.decode().strip()

                # Parse CPU usage (approximate)
                cpu_count = 1
                for line in dominfo.split("\n"):
                    if "CPU(s):" in line:
                        cpu_count = int(line.split(":")[1].strip())
                        break

                # Each VM contributes to CPU usage based on its CPU count
                total_cpu += cpu_count * 5  # Approximation

                # Get memory usage
                for line in dominfo.split("\n"):
                    if "Used memory:" in line:
                        mem_kb = int(line.split(":")[1].strip().split()[0])
                        mem_percent = (
                            mem_kb / (psutil.virtual_memory().total / 1024)
                        ) * 100
                        total_mem += mem_percent
                        break

                # Get disk usage (approximate based on image size)
                total_disk += 5  # Placeholder value per VM

        return {
            "cpu": min(total_cpu, 100),
            "memory": min(total_mem, 100),
            "storage": min(total_disk, 100),
        }
    except Exception as e:
        logger.error(f"Error getting VM stats: {e}", exc_info=True)
        return {"cpu": 0, "memory": 0, "storage": 0}


def get_system_usage(
    total_cpu: float, total_memory: float, total_disk: float
) -> Dict[str, float]:
    """Get resource usage by system processes"""
    # Get basic metrics first
    cpu_percent = total_cpu
    memory_percent = total_memory
    disk_percent = total_disk

    # Get VM and Docker usage
    vm_usage = get_vm_usage()
    docker_usage = get_docker_usage()

    # Calculate system usage as the difference between total and VM+Docker
    # with a minimum system usage threshold
    system_cpu = max(5.0, cpu_percent - vm_usage["cpu"] - docker_usage["cpu"])
    system_memory = max(
        10.0, memory_percent - vm_usage["memory"] - docker_usage["memory"]
    )
    system_disk = max(
        20.0, disk_percent - vm_usage["storage"] - docker_usage["storage"]
    )

    # Calculate "other" usage to account for any remaining resources
    # or adjust if our calculations went over 100%
    other_cpu = max(0.0, 100.0 - system_cpu - vm_usage["cpu"] - docker_usage["cpu"])
    other_memory = max(
        0.0, 100.0 - system_memory - vm_usage["memory"] - docker_usage["memory"]
    )
    other_disk = max(
        0.0, 100.0 - system_disk - vm_usage["storage"] - docker_usage["storage"]
    )

    return {
        "system": {"cpu": system_cpu, "memory": system_memory, "storage": system_disk},
        "other": {"cpu": other_cpu, "memory": other_memory, "storage": other_disk},
    }


# Cache metrics for 2 seconds
last_metrics = {}
last_metrics_time = 0
CACHE_TTL = 2  # seconds


async def get_docker_usage_async() -> Dict[str, float]:
    """Async wrapper for Docker usage stats"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, get_docker_usage)


async def get_vm_usage_async() -> Dict[str, float]:
    """Async wrapper for VM stats"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, get_vm_usage)


@app.get("/metrics")
async def get_metrics() -> Dict:
    global last_metrics, last_metrics_time

    # Return cached data if available and fresh
    current_time = time.time()
    if current_time - last_metrics_time < CACHE_TTL and last_metrics:
        return last_metrics

    try:
        # Add safety measures for history updates
        if not cpu_history:
            # Initialize with at least one data point if empty
            add_to_history()
        elif should_update_history():
            add_to_history()

        # Add a timeout for expensive operations
        vm_usage_task = asyncio.create_task(get_vm_usage_async())
        docker_usage_task = asyncio.create_task(get_docker_usage_async())

        # Continue with the rest of the function...
        if should_update_history():
            add_to_history()

        # Get current metrics
        cpu_freq = psutil.cpu_freq()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        # Get CPU, memory and disk usage
        cpu_percent = cpu_history[-1]["usage"] if cpu_history else 0
        memory_percent = memory_history[-1]["usage"] if memory_history else 0
        disk_percent = disk_history[-1]["usage"] if disk_history else 0

        # Run expensive operations concurrently
        vm_usage, docker_usage = await asyncio.gather(
            get_vm_usage_async(), get_docker_usage_async()
        )

        # Get usage by system and other processes
        system_other_usage = get_system_usage(cpu_percent, memory_percent, disk_percent)

        # Resource distribution data
        distribution = {
            "virtualMachines": vm_usage,
            "dockerContainers": docker_usage,
            "system": system_other_usage["system"],
            "other": system_other_usage["other"],
        }

        result = {
            "cpu": {
                "usage_percent": cpu_percent,
                "frequency_mhz": cpu_freq.current if cpu_freq else None,
                "cores": psutil.cpu_count(),
                "history": list(cpu_history),
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory_percent,
                "used": memory.used,
                "history": list(memory_history),
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk_percent,
                "history": list(disk_history),
            },
            "distribution": distribution,
            "timestamp": time.time(),
        }

        # Update cache
        last_metrics = result
        last_metrics_time = current_time

        return result
    except Exception as e:
        logger.error(f"Error in get_metrics: {e}", exc_info=True)
        if last_metrics:  # Return cached data on error
            return last_metrics
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    logger.info("Starting FastAPI server...")
    logger.info("Swagger UI will be available at: http://localhost:8000/docs")
    logger.info("ReDoc will be available at: http://localhost:8000/redoc")
    logger.info("Health check endpoint: http://localhost:8000/health")

    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        logger.critical(f"Server crashed: {e}", exc_info=True)
        sys.exit(1)
