import { HttpStatus } from '$/app/models/http_model.js';
import config from '$/config.js';
import jsonwebtoken from 'jsonwebtoken';
import mysqlService from '$/app/src/mysqlService.js';
import { getShaFromText } from '$/app/src/helpers.js';

export const loginController = (req, res) =>  {
  mysqlService.query("SELECT * FROM users WHERE email=? AND password_hash=? ", [
    req.body.email,
    getShaFromText(req.body.password),
  ], (error, result) => {
    if (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Internal Error: ${ error }`);
    }
    else {
      if (result && result.length > 0) {
        const userId = result[0].id;
        const token = jsonwebtoken.sign({ userId }, config.loginSecret, {
          expiresIn: 86400 // expires in 24 hours
        });
        const loginResp = {
          userId,
          name: result[0].name,
          email: result[0].email,
          auth: true,
          token,
        };

        res.send(loginResp);
      }
      else {
        res.status(HttpStatus.UNAUTHORIZED).send("Email or password incorrect.");
      }
    }
  });
}

export const registerController = (req,res) => {
  const sqlParams = {
    name: req.body.name,
    email: req.body.email,
    password_hash: getShaFromText(req.body.password),
  };
  mysqlService.query("INSERT INTO users SET ?", sqlParams, (error, result) => {
    if (error) {
      console.error(error);
      if (error.code === "ER_DUP_ENTRY") res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Email already used.");
      else res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Internal Error: ${ error }`);
    } else {
      if (result.affectedRows == 1) res.send(sqlParams);
      else res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Mysql Error: ${ dbResponse }`);
    }
  })
}

export const addDeviceController = (req, res) => {
  const sqlParams = {
    user_id: req.userId,
    device_name: req.body.deviceName,
  };
  mysqlService.query("INSERT INTO devices SET ?", sqlParams, (error, result) => {
    if (error) {
      console.error(error);
      if (error.code === "ER_DUP_ENTRY") res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Device already used.");
      else res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Internal Error: ${ error }`);
    } else {
      if (result.affectedRows == 1) res.send(sqlParams);
      else res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Mysql Error: ${ dbResponse }`);
    }
  })
}

export const getDevicesController = async (req, res) =>  {
  mysqlService.query("SELECT * FROM devices WHERE user_id=?", [
    req.userId,
  ], (error, result) => {
    if (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Internal Error: ${ error }`);
    }
    else {
      const devices = result.map((device) => {
        const numClients = _numClientsInRoom('/devices', device.device_name);
        console.log('numClients', numClients);
        const connected = numClients > 0;
        return { connected, ...device};
      })
      res.send(devices);
    }
  });
}

export const createStreamingSessionController = (req, res ,io) => {
  const sessionId = getShaFromText(`${req.body.deviceName}${config.streamingSessionSecret}${(new Date()).toString()}`)
  io.of('/devices').to(req.body.deviceName).emit("sessionInit", { sessionId })
  res.send({ sessionId });
}

const _numClientsInRoom = (namespace, room, io) => {
  var clients = io.nsps[namespace].adapter.rooms[room];
  return Object.keys(clients).length;
}