const mysql = require('mysql');
require('dotenv').config();


const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
const database = process.env.DB_NAME;

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
