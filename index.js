console.log("Server loading...");
import express from 'express';
import bodyParser from 'body-parser';
import { VerifyToken, userOwnsDevice } from '$/app/src/helpers.js';
import {
  loginController,
  registerController,
  createStreamingSessionController,
  addDeviceController,
  getDevicesController,
} from '$/app/src/controllers.js';
import https from 'https';
import fs from 'fs';
import { Server as SocketIoServer } from "socket.io";

const app = express();
const HTTP_PORT = 443;

const httpsServer = https.createServer({
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
  passphrase: 'deviceManager',
}, app);

const io = new SocketIoServer(httpsServer, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.of(`/signaling`).on('connection', (socket) => {

  socket.on('connectToSession', (data) => {
    console.log('connectToSession', data);
    socket.join(data.sessionId);
  });

  socket.on('sendSignal', (data) => {
    console.log('sendSignal', data);
    io.of(`/signaling`).to(data.sessionId).emit('listenSignal', data)
  });
});

io.of(`/devices`).on('connection', (socket) => {
  socket.on('addToConnectedDevices', (data) => {
    console.log('addToConnectedDevices', data);
    socket.join(data.deviceName);
  });
});

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
app.post('/createStreamingSession', VerifyToken, (req, res) => createStreamingSessionController(req, res, io));
app.post('/addDevice', VerifyToken, (req, res) => addDeviceController(req, res));
app.get('/getDeivces', VerifyToken, userOwnsDevice, (req, res) => getDevicesController(req, res, io));

app.get('/me', VerifyToken, (req, res) =>  res.status(200).send({ auth: true }));

httpsServer.listen(HTTP_PORT, () => {
  console.log(`Https server running on port ${HTTP_PORT}`);
});
