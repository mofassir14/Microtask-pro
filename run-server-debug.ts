import { spawn } from 'child_process';
import fs from 'fs';

const log = fs.createWriteStream('server.log');
const server = spawn('npx', ['tsx', 'server.ts'], {
  env: { ...process.env, NODE_ENV: 'development' }
});

server.stdout.pipe(log);
server.stderr.pipe(log);

server.on('exit', (code) => {
  fs.appendFileSync('server.log', `\nServer exited with code ${code}\n`);
});

console.log("Server started in background, logging to server.log");
setTimeout(() => {
  console.log("Current log content:");
  console.log(fs.readFileSync('server.log', 'utf8'));
}, 10000);
