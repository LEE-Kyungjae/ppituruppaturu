const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Homepage loaded successfully');
    console.log(`Content length: ${data.length} characters`);

    // Test games page
    testGamesPage();
  });
});

function testGamesPage() {
  const gameOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/games',
    method: 'GET',
  };

  const gameReq = http.request(gameOptions, (res) => {
    console.log(`Games page status: ${res.statusCode}`);
    let gameData = '';
    res.on('data', (chunk) => {
      gameData += chunk;
    });
    res.on('end', () => {
      console.log('Games page loaded successfully');
      console.log(`Games content length: ${gameData.length} characters`);
      process.exit(0);
    });
  });

  gameReq.on('error', (err) => {
    console.error(`Games page error: ${err.message}`);
    process.exit(1);
  });

  gameReq.end();
}

req.on('error', (err) => {
  console.error(`Homepage error: ${err.message}`);
  process.exit(1);
});

req.end();