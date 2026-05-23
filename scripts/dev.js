const net = require('net');
const { spawn } = require('child_process');

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port);
  });
}

async function findFreePort(start = 3000, end = 3010) {
  for (let port = start; port <= end; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found between ${start} and ${end}`);
}

(async () => {
  const port = await findFreePort();
  console.log(`Starting Next.js dev server on http://localhost:${port}`);
  const child = spawn('npx', ['next', 'dev', '-p', port], {
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
})();
