const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

const pfxPath = path.join(__dirname, 'certificate.pfx');

const httpsOptions = {
  pfx: fs.readFileSync(pfxPath),
  passphrase: 'reveal2026'
};

const port = parseInt(process.env.PORT, 10) || 3000;
const host = '0.0.0.0';

app.prepare().then(() => {
  // HTTPS Server (For mobile devices to grant microphone permissions natively)
  https.createServer(httpsOptions, (req, res) => {
    handle(req, res);
  }).listen(port, host, (err) => {
    if (err) throw err;
    console.log(`> 🔒 REVEAL 2.0 Secure HTTPS Server ready on https://localhost:${port}`);
    console.log(`> 📱 Access on Mobile via: https://<YOUR-IP>:${port}`);
  });
}).catch((err) => {
  console.error('Error starting HTTPS server:', err);
  process.exit(1);
});
