const { Client, Pool } = require('pg') // PREREQUISITE: Have postgres installed and your user can connect

require('dotenv').config()
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  max: 5 // 5 clients each, god help us all if this isn't sufficient
})

pool.on('error', (e) => {
  console.error('Postgres error', e)
})

module.exports = {
  query: async (sqlString, formatArgs) => {
    // SQL injection is taken care of by node-postgres. I'm certain that
    // making my own would be pretty bad compared to a professionally vetted one.
    let transactionClient
    try {
      transactionClient = await pool.connect()
      const returnVals = await transactionClient.query(sqlString, formatArgs)
      transactionClient.release()
      return returnVals
    } catch (e) {
      if (transactionClient) transactionClient.release()
      throw new Error(e)
    }
  },
  getPostgresClient: async () => {
    // all calls of this must function .release() on the return value
    try {
      const transactionClient = await pool.connect()
      return transactionClient
    } catch (e) {
      throw new Error(e)
    }
  },
  end: cb => {
    pool.end(cb)
  }
}
