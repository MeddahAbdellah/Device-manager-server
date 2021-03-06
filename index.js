console.log("Server loading...");
import express from 'express';
import bodyParser from 'body-parser';
import { VerifyToken } from '$/app/src/helpers.js';
import { loginController, registerController } from './app/src/controllers.js';
import https from 'https';

const app = express();
const HTTP_PORT = 443;


app.use(express.static("public"));
app.set('view engine', 'ejs');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))
// parse application/json
app.use(bodyParser.json())
//headers
app.use(function(req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware()
  next();
});
app.get('/', (req, res) => res.send('Server is up!'))
app.post('/login', loginController);
app.post('/register', registerController);
app.get('/me', VerifyToken, (req, res) =>  res.status(200).send('able to access'));

https.createServer({
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
  passphrase: 'deviceManager',
}, app)
.listen(HTTP_PORT, () => {
  console.log(`Https server running on port ${HTTP_PORT}`);
});
