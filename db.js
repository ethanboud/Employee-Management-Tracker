const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'employee_db', 
  user: 'postgres', 
  password: 'asdf', 
});

client.connect();

module.exports = client;
