import { HttpStatus } from '../models/http_model.js';

export const VerifyToken = (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token)
      return res.status(HttpStatus.UNAUTHORIZED).send({ auth: false, message: 'No token provided.' });
      
    jwt.verify(token, config.secret, function(err, decoded) {
      if (err)
      return res.status(HttpStatus.UNAUTHORIZED).send({ auth: false, message: 'Failed to authenticate token.' });
        
      // if everything good, save to request for use in other routes
      req.userId = decoded.id;
      next();
    });
  }