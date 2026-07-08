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
  require('./check-supabase-env');

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const nodeMinor = Number(process.versions.node.split('.')[1] ?? 0);
  if (nodeMajor < 22 && (nodeMajor < 20 || nodeMinor < 4)) {
    console.warn(
      `\n⚠ Node ${process.versions.node} is below recommended for custom UI (Node 22+).`,
      `\n  @cursor/sdk needs Symbol.dispose — a polyfill is applied, but Node 22+ is more reliable.\n`,
    );
  } else if (nodeMajor < 22) {
    console.warn(
      `\n⚠ Node ${process.versions.node}: custom UI uses @cursor/sdk which prefers Node 22+ (Symbol.dispose).`,
      `\n  A runtime polyfill is applied automatically.\n`,
    );
  }

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
