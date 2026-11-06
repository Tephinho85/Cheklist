const { spawn } = require('child_process');
const child = spawn('npm.cmd', ['run', 'start'], { stdio: 'inherit', shell: true });
child.on('close', (code) => { process.exit(code); });
