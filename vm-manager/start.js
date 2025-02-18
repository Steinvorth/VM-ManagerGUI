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

  // Check if we need to create the venv
  if (!existsSync(venvPath)) {
    console.log('Creating Python virtual environment...');
    try {
      // Ensure python3-venv is installed
      if (process.platform === 'linux') {
        try {
          execSync('python3 -m venv --help', { stdio: 'ignore' });
        } catch {
          console.log('Installing python3-venv...');
          execSync('sudo apt-get update && sudo apt-get install -y python3-venv', { 
            stdio: 'inherit' 
          });
        }
      }

      // Create venv
      execSync(`python3 -m venv ${venvPath}`, { 
        stdio: 'inherit',
        cwd: apiDir 
      });

      // Activate venv and install requirements
      const activateCmd = process.platform === 'win32' 
        ? `${join(venvPath, 'Scripts', 'activate.bat')}`
        : `. ${join(venvPath, 'bin', 'activate')}`;

      const pipInstall = `pip install --upgrade pip && pip install -r ${requirementsPath}`;
      
      if (process.platform === 'win32') {
        execSync(`${activateCmd} && ${pipInstall}`, { 
          stdio: 'inherit',
          shell: true,
          cwd: apiDir 
        });
      } else {
        execSync(`bash -c '${activateCmd} && ${pipInstall}'`, { 
          stdio: 'inherit',
          shell: true,
          cwd: apiDir 
        });
      }

      console.log('Python environment setup complete!');
    } catch (error) {
      console.error('Failed to setup Python environment:', error);
      process.exit(1);
    }
  }

  return venvPath;
}

function startServers() {
  const apiDir = resolve(__dirname, 'api');
  const venvPath = join(apiDir, 'venv');
  const pythonBin = process.platform === 'win32'
    ? join(venvPath, 'Scripts', 'python.exe')
    : join(venvPath, 'bin', 'python');
  const activateCmd = process.platform === 'win32'
    ? join(venvPath, 'Scripts', 'activate.bat')
    : join(venvPath, 'bin', 'activate');

  // Start Python API with activated venv
  console.log('Starting Python API...');
  const pythonApi = process.platform === 'win32'
    ? spawn('cmd', ['/C', `${activateCmd} && ${pythonBin} main.py`], {
        stdio: 'inherit',
        shell: true,
        cwd: apiDir
      })
    : spawn('bash', ['-c', `source ${activateCmd} && ${pythonBin} main.py`], {
        stdio: 'inherit',
        shell: true,
        cwd: apiDir
      });

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

// Main execution
try {
  setupPythonEnv();
  startServers();
} catch (error) {
  console.error('Startup failed:', error);
  process.exit(1);
}