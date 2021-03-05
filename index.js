console.log("Server loading...");
import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import jssha from 'jssha';

const app = express();
const HTTP_PORT = 8080;
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  port: "3306",
  database: ""
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
  con.query("SELECT * FROM users WHERE email=? AND password=? ", [
    req.body.email,
    req.body.password
  ], (error, result) => {
    if (error) {console.error(error); res.status(500).send("Internal Error");}
    else {
      dbResponse = JSON.parse(JSON.stringify(result));
      if (dbResponse.length>0) {
        loginResp = {
          user_id: dbResponse[0].id,
          name: dbResponse[0].name,
          email: dbResponse[0].email,
        };
        res.send(loginResp);
      }
      else {
          res.status(500).send("Email or password incorrect.");
      }
    }
  });
});

app.post('/register', (req,res) => {
  let shaHasher = new jssha("SHA-256", "TEXT");
  shaHasher.update(req.query.name+req.body.email+req.body.password+ new Date().toString());
  userHashedID = shaHasher.getHash("HEX");
  sqlParams = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  };
  con.query("INSERT INTO users SET ?", sqlParams, (error, result) => {
    if (error) {
      console.error(error);
      if (error.code==="ER_DUP_ENTRY")res.status(500).send("Email or Phone number already used.");
      else res.status(500).send("Internal Error");
    } else {
      dbResponse = JSON.parse(JSON.stringify(result));
      if (dbResponse.affectedRows==1)res.send(sqlParams);
      else res.status(500).send("Internal Error");
    }
  })
})

app.listen(HTTP_PORT);
