require('dotenv').config();
const sql = require('mssql');
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
    }
    
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();
pool.on('error', err => {
    console.error('Erro no Pool de Conexões SQL:', err);
});

module.exports = {
    pool,
    poolConnect
};