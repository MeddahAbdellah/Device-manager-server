import { HttpStatus } from '$/app/models/http_model.js';
import jsonwebtoken from 'jsonwebtoken';
import config from '$/config.js';
import jssha from 'jssha';

export const VerifyToken = (req, res, next) => {
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(HttpStatus.UNAUTHORIZED).send({ auth: false, message: 'No token provided.' });
    
  jsonwebtoken.verify(token, config.loginSecret, function(err, decoded) {
    if (err)
    return res.status(HttpStatus.UNAUTHORIZED).send({ auth: false, message: 'Failed to authenticate token.' });
      
    // if everything good, save to request for use in other routes
    req.userId = decoded.id;
    next();
  });
}

export const getShaFromText = (text) => {
  const sha = new jssha("SHA-256", "TEXT");
  sha.update(text);
  return sha.getHash('HEX');
}