const mysql = require('mysql');
require('dotenv').config();


const host = 'mysql://bb6ebd34576fb2:2f557404@eu-cdbr-west-02.cleardb.net/heroku_ecacc05816a39f9?reconnect=true';
const user = 'bb6ebd34576fb2';
const pass = 'dcba3381e562fca';
const database = 'heroku_ecacc05816a39f9';

const connection = mysql.createConnection({
  host: host,
  user: user,
  password: pass,
  database: database,
});

connection.connect(function (err) {
  if (err) console.log(err);
  console.log('database connected')
});

module.exports = connection;
