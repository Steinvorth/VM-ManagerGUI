import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const API_PORT = 8000;
const CHECK_INTERVAL = 10000; // 10 seconds
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toISOString();
}

function log(message) {
  const logMessage = `[${timestamp()}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(path.join(LOGS_DIR, 'watchdog.log'), logMessage);
}

function startAPI() {
  log('Starting API server...');
  
  const pythonProcess = spawn('python', ['main.py'], {
    stdio: 'pipe',
    env: process.env
  });
  
  pythonProcess.stdout.on('data', (data) => {
    log(`API: ${data.toString().trim()}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    log(`API ERROR: ${data.toString().trim()}`);
  });
  
  pythonProcess.on('close', (code) => {
    log(`API process exited with code ${code}`);
    // Restart if crashed
    if (code !== 0) {
      log('API crashed, restarting...');
      setTimeout(startAPI, 1000);
    }
  });
  
  return pythonProcess;
}

// Check if API is running, restart if needed
async function checkAPI(apiProcess) {
  try {
    const response = await fetch(`http://localhost:${API_PORT}/health`);
    if (!response.ok) {
      log('API health check failed, restarting...');
      apiProcess.kill();
      return startAPI();
    }
    return apiProcess;
  } catch (err) {
    log(`API health check error: ${err.message}`);
    apiProcess.kill();
    return startAPI();
  }
}

// Start initial API process
let apiProcess = startAPI();

// Set up monitoring interval
setInterval(async () => {
  apiProcess = await checkAPI(apiProcess);
}, CHECK_INTERVAL);

// Handle process termination
process.on('SIGINT', () => {
  log('Watchdog stopping, killing API process...');
  apiProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Watchdog stopping, killing API process...');
  apiProcess.kill();
  process.exit(0);
});

log('Watchdog started and monitoring API');