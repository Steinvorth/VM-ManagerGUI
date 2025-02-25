import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function isWSL() {
  if (process.platform !== 'linux') return false;
  try {
    const release = execSync('uname -r').toString().toLowerCase();
    return release.includes('microsoft') || release.includes('wsl');
  } catch {
    return false;
  }
}

function setupPythonEnv() {
  const apiDir = resolve(__dirname, 'api');
  const venvPath = join(apiDir, 'venv');
  const requirementsPath = join(apiDir, 'requirements.txt');

  console.log('Setting up Python environment...');
  try {
    // Ensure python3-venv is installed
    if (process.platform === 'linux') {
      try {
        execSync('python3-venv --version', { stdio: 'ignore' });
      } catch {
        console.log('Installing python3-venv...');
        execSync('sudo apt-get update && sudo apt-get install -y python3-venv', {
          stdio: 'inherit'
        });
      }
    }

    // Create logs directory
    const logsDir = join(apiDir, 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    // Create new venv if it doesn't exist or update if it does
    if (!existsSync(venvPath)) {
      console.log('Creating new virtual environment...');
      execSync(`python3 -m venv "${venvPath}"`, {
        stdio: 'inherit',
        cwd: apiDir
      });
    }

    // Install requirements
    console.log('Installing Python dependencies...');
    const pipPath = join(venvPath, 'bin', 'pip');
    execSync(`"${pipPath}" install --upgrade pip`, {
      stdio: 'inherit',
      cwd: apiDir
    });
    execSync(`"${pipPath}" install -r "${requirementsPath}"`, {
      stdio: 'inherit',
      cwd: apiDir
    });

    console.log('Python environment setup complete!');
    return venvPath;
  } catch (error) {
    console.error('Failed to setup Python environment:', error);
    process.exit(1);
  }
}

async function waitForApiReady() {
  console.log('Waiting for API to start...');
  const maxRetries = 15; // Increase timeout to 15 seconds
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        console.log('API is ready!');
        return true;
      }
    } catch (e) {
      // Ignore error and retry
    }
    
    // Wait 1 second before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  
  console.error('\nAPI failed to start within timeout period');
  return false;
}

function startPythonApi() {
  const apiDir = resolve(__dirname, 'api');
  const venvPath = join(apiDir, 'venv');
  const pythonBin = join(venvPath, 'bin', 'python');
  
  console.log('Starting Python API...');
  const pythonApi = spawn('bash', [
    '-c',
    `export VIRTUAL_ENV="${venvPath}" && \
     export PATH="${venvPath}/bin:$PATH" && \
     cd "${apiDir}" && \
     exec "${pythonBin}" main.py`
  ], {
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      VIRTUAL_ENV: venvPath,
      PATH: `${join(venvPath, 'bin')}:${process.env.PATH}`
    }
  });

  // Handle API output for better diagnostics
  pythonApi.stdout.on('data', (data) => {
    console.log(`[API] ${data.toString().trim()}`);
  });

  pythonApi.stderr.on('data', (data) => {
    console.error(`[API ERROR] ${data.toString().trim()}`);
  });
  
  return pythonApi;
}

async function startServers() {
  const apiDir = resolve(__dirname, 'api');
  const venvPath = join(apiDir, 'venv');
  const pythonBin = join(venvPath, 'bin', 'python');
  
  // Verify venv exists
  if (!existsSync(venvPath)) {
    throw new Error('Python virtual environment not found. Please run setup first.');
  }

  // Start Python API with improved logging
  console.log('Starting Python API...');
  let pythonApi = spawn('bash', [
    '-c',
    `export VIRTUAL_ENV="${venvPath}" && \
     export PATH="${venvPath}/bin:$PATH" && \
     cd "${apiDir}" && \
     exec "${pythonBin}" main.py`
  ], {
    stdio: 'pipe', // Capture output for better logging control
    shell: true,
    env: {
      ...process.env,
      VIRTUAL_ENV: venvPath,
      PATH: `${join(venvPath, 'bin')}:${process.env.PATH}`
    }
  });

  // Handle API output for better diagnostics
  pythonApi.stdout.on('data', (data) => {
    console.log(`[API] ${data.toString().trim()}`);
  });

  pythonApi.stderr.on('data', (data) => {
    console.error(`[API ERROR] ${data.toString().trim()}`);
  });

  // Wait for API to start
  const apiReady = await waitForApiReady();
  
  if (!apiReady) {
    console.error('API failed to start, check logs for details');
    pythonApi.kill();
    process.exit(1);
  }

  // Only start Vite server if API is running
  // Install npm dependencies if needed
  if (!existsSync(join(__dirname, 'node_modules'))) {
    console.log('Installing npm dependencies...');
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
  }

  // Start Vite dev server
  console.log('Starting Vite development server...');
  const viteServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  // Handle cleanup
  const cleanup = () => {
    console.log('\nShutting down servers...');
    pythonApi.kill();
    viteServer.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Set up health check interval for API
  const healthCheckInterval = setInterval(async () => {
    try {
      const response = await fetch('http://localhost:8000/health', { 
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      if (!response.ok) {
        console.error('API health check failed, attempting restart...');
        pythonApi.kill();
        pythonApi = startPythonApi(); // Reassign the new process
      }
    } catch (e) {
      console.error('API health check failed (connection error), attempting restart...');
      try {
        pythonApi.kill();
      } catch (err) {
        // Process might already be dead
      }
      pythonApi = startPythonApi(); // Reassign the new process
    }
  }, 30000); // Check every 30 seconds

  // Stop checking when the process exits
  process.on('exit', () => {
    clearInterval(healthCheckInterval);
  });

  // When Vite exits, kill the API too
  viteServer.on('close', () => {
    console.log('Vite server closed, shutting down API...');
    pythonApi.kill();
    clearInterval(healthCheckInterval);
    process.exit();
  });

  // Handle errors
  pythonApi.on('error', (err) => {
    console.error('Failed to start Python API:', err);
    viteServer.kill();
    process.exit(1);
  });

  viteServer.on('error', (err) => {
    console.error('Failed to start Vite server:', err);
    pythonApi.kill();
    process.exit(1);
  });
}

// Main execution
try {
  setupPythonEnv();
  startServers();
} catch (error) {
  console.error('Startup failed:', error);
  process.exit(1);
}