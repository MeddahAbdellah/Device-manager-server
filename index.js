console.log("Server loading...");
import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import jssha from 'jssha';
import HttpStatus from './app/models/http_model.ts';

const app = express();
const HTTP_PORT = 80;
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  port: "3306",
  database: "device_manager"
});
con.connect();

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
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware()
  next();
});
app.get('/', (req, res) => res.send('Server is up!'))
app.post('/login', (req, res) => {
  con.query("SELECT * FROM users WHERE email=? AND password_hash=? ", [
    req.body.email,
    new jssha("SHA-256", "TEXT").update(req.body.password).getHash("HEX"),
  ], (error, result) => {
    if (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Internal Error: ${ error }`);
    }
    else {
      if (result && result.length > 0) {
        loginResp = {
          user_id: result[0].id,
          name: result[0].name,
          email: result[0].email,
        };
        res.send(loginResp);
      }
      else {
          res.status(HttpStatus.UNAUTHORIZED).send("Email or password incorrect.");
      }
    }
  });
});

app.post('/register', (req,res) => {
  sqlParams = {
    name: req.body.name,
    email: req.body.email,
    password_hash: new jssha("SHA-256", "TEXT").update(req.body.password).getHash("HEX"),
  };
  con.query("INSERT INTO users SET ?", sqlParams, (error, result) => {
    if (error) {
      console.error(error);
      if (error.code==="ER_DUP_ENTRY")res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Email already used.");
      else res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Internal Error: ${ error }`);
    } else {
      if (result.affectedRows == 1) res.send(sqlParams);
      else res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Mysql Error: ${ dbResponse }`);
    }
  })
})

app.listen(HTTP_PORT);
