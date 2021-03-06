console.log("Server loading...");
import express from 'express';
import bodyParser from 'body-parser';
import { VerifyToken } from '$/app/src/helpers.js';
import { loginController, registerController } from '$/app/src/controllers.js';
import https from 'https';
import fs from 'fs';
import { Server as SocketIoServer } from "socket.io";

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
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.get('/', (req, res) => res.send('Server is up!'))
app.post('/login', loginController);
app.post('/register', registerController);
app.get('/me', VerifyToken, (req, res) =>  res.status(200).send('able to access'));

const httpsServer = https.createServer({
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
  passphrase: 'deviceManager',
}, app)

const io = new SocketIoServer(httpsServer, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.on("connection", (socket) => {
});

io.of('/test1').on("connection", (socket) => {
  socket.on('message', (data) => {
    console.log('from test1 ', data);
  });
});

io.of('/test2').on("connection", (socket) => {
  socket.on('message', (data) => {
    console.log('from test2 ', data);
    io.of('/test1').emit('fromTest2', data);
  });
});

httpsServer.listen(HTTP_PORT, () => {
  console.log(`Https server running on port ${HTTP_PORT}`);
});
