const sql = require('mysql2/promise');
const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'petshop'
};

const connectDB = sql.createPool(config);
async function connectDB() {
    try {
        const connection = await connectDB.getConnection();
        console.log('Conexão bem-sucedida ao banco de dados!');
        connection.release(); // Libera a conexão após o uso
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        process.exit(1); // Encerra o processo se a conexão falhar
    }
    return connectDB;
}

module.exports = connectDB;