
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const dbConnection = require('./config/db');

//rotas
const clienteRoutes = require('./routes/clienteRoutes');
const animalRoutes = require('./routes/animalRoutes');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/clientes', clienteRoutes);
app.use('/animais', animalRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/clientes', async (req, res) => {
    let connection;
    try {
        connection = await dbConnection.getConnection();
        const [rows] = await connection.execute(`
            SELECT c.ID_Cliente, c.Nome, c.CPF FROM cliente c
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).send('Erro ao buscar clientes.');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

app.listen(8080, () => {
    console.log('Servidor rodando na porta 8080');
});