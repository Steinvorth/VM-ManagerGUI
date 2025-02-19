import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
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

    // Remove existing venv if it exists
    if (existsSync(venvPath)) {
      console.log('Removing existing virtual environment...');
      execSync(`rm -rf "${venvPath}"`, { stdio: 'inherit' });
    }

    // Create new venv
    console.log('Creating new virtual environment...');
    execSync(`python3 -m venv "${venvPath}"`, {
      stdio: 'inherit',
      cwd: apiDir
    });

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

function checkVenvActive(venvPath) {
  try {
    // Check if VIRTUAL_ENV is set correctly
    const venvCheck = process.platform === 'win32'
      ? execSync(`${join(venvPath, 'Scripts', 'python.exe')} -c "import sys; print(sys.prefix)"`, { 
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf8'
        }).trim()
      : execSync(`${join(venvPath, 'bin', 'python')} -c "import sys; print(sys.prefix)"`, {
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf8'
        }).trim();

    return venvCheck === venvPath;
  } catch (error) {
    return false;
  }
}

function startServers() {
  const apiDir = resolve(__dirname, 'api');
  const venvPath = join(apiDir, 'venv');
  const pythonBin = join(venvPath, 'bin', 'python');
  
  // Verify venv exists
  if (!existsSync(venvPath)) {
    throw new Error('Python virtual environment not found. Please run setup first.');
  }

  // Start Python API
  console.log('Starting Python API...');
  const pythonApi = spawn('bash', [
    '-c',
    `export VIRTUAL_ENV="${venvPath}" && \
     export PATH="${venvPath}/bin:$PATH" && \
     cd "${apiDir}" && \
     exec "${pythonBin}" main.py`
  ], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VIRTUAL_ENV: venvPath,
      PATH: `${join(venvPath, 'bin')}:${process.env.PATH}`
    }
  });

  // Wait for API to start
  console.log('Waiting for API to start...');
  let apiReady = false;
  let retries = 0;
  const maxRetries = 10;

  while (!apiReady && retries < maxRetries) {
    try {
      execSync('curl -s http://localhost:8000/health', { stdio: 'ignore' });
      apiReady = true;
      console.log('API is ready!');
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        console.error('Failed to start API server');
        process.exit(1);
      }
      execSync('sleep 1');
    }
  }

  // Only start Vite server if API is running
  if (apiReady) {
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
}

// Main execution
try {
  setupPythonEnv();
  startServers();
} catch (error) {
  console.error('Startup failed:', error);
  process.exit(1);
}