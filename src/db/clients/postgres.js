const { Client, Pool } = require('pg') // PREREQUISITE: Have postgres installed and your user can connect

require('dotenv').config()
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: 5432
})

pool.on('error', (e) => {
  console.error('Postgres error', e)
})

module.exports = pool
