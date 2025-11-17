require('dotenv').config();
const http = require('http');
const app = require('./app');
const { convertAmount, RATE_MAP } = require('./services/currencyService');
const { getData, setData, persistData, closeDB } = require('./services/dataService');

let server;

function createServer() {
  return app;
}

function startServer(port = process.env.PORT || 3000) {
  if (server) return server;
  server = http.createServer(app);
  server.listen(port, () => {
    console.log(`FinTrackr server listening on http://localhost:${port}`);
  });
  return server;
}

function stopServer() {
  if (server) {
    server.close(() => {
      closeDB();
    });
    server = null;
  }
}

if (require.main === module) {
  startServer();

  const shutdown = () => {
    console.log('Shutting down server...');
    stopServer();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = {
  RATE_MAP,
  convertAmount,
  createServer,
  getData,
  setData,
  persistData,
  startServer,
  stopServer,
};
