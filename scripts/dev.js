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
  const preferred = 3000;
  const port = await findFreePort(preferred, 3010);
  if (port !== preferred) {
    console.warn(
      `\n⚠ Port ${preferred} is in use — using http://localhost:${port} instead.`,
      `\n  Close other dev servers or hard-refresh the tab on the URL below.\n`
    );
  }
  console.log(`\n→ Open: http://localhost:${port}\n`);
  const child = spawn('npx', ['next', 'dev', '-p', port], {
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
})();
