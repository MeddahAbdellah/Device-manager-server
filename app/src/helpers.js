import { HttpStatus } from '$/app/models/http_model.js';
import jsonwebtoken from 'jsonwebtoken';
import config from '$/config.js';
import jssha from 'jssha';
import mysqlService from '$/app/src/mysqlService.js';

export const VerifyToken = (req, res, next) => {
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(HttpStatus.UNAUTHORIZED).send({ auth: false, message: 'No token provided.' });
    
  jsonwebtoken.verify(token, config.loginSecret, function(err, decoded) {
    if (err)
    return res.status(HttpStatus.UNAUTHORIZED).send({ auth: false, message: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.userId = decoded.userId;
    next();
  });
}

export const userOwnsDevice = (req, res, next) => {
  mysqlService.query("SELECT * FROM devices WHERE user_id=? AND device_name=? ", [
    req.userId,
    req.body.deviceName,
  ], (error, result) => {
    if (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Internal Error: ${ error }`);
    }
    else {
      if (result && result.length > 0) {
        next();
      }
      else {
        res.status(HttpStatus.UNAUTHORIZED).send("You don't own this device.");
      }
    }
  });
}

export const getShaFromText = (text) => {
  const sha = new jssha("SHA-256", "TEXT");
  sha.update(text);
  return sha.getHash('HEX');
}