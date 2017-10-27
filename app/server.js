const config = require('./lib/config');
const app = require('./app');

const portNumber = process.env.PORT || config.port;
console.log('clicksite running on http://localhost:' + portNumber);
app.listen(portNumber);