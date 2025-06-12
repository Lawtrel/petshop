const express = require('express');
const router = express.Router();
const dbConnection = require('../config/db');

router.get('/animais', async (req, res) => {
    const { idCliente, nome, especie, raca } = req.body;
    //validacao
    if (!idCliente || !nome || !especie || !raca) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }
    let connection;
    try {
        connection = await dbConnection.getConnection();
        await connection.beginTransaction();

        let [especieRows] = await connection.execute('SELECT ID_Especie FROM especie WHERE Especie = ?', [especie]);
        let idEspecie;
        if (especieRows.length > 0) {
            idEspecie = especieRows[0].ID_Especie;
        } else {
            const [result] = await connection.execute('INSERT INTO especie (Especie) VALUES (?)', [especie]);
            idEspecie = result.insertId;
        }

        let [racaRows] = await connection.execute('SELECT ID_Raca FROM raca WHERE Nome = ? AND ID_Especie = ?', [raca, idEspecie]);
        let idRaca;
        if (racaRows.length > 0) {
            idRaca = racaRows[0].ID_Raca;
        } else {
            const [result] = await connection.execute('INSERT INTO raca (Nome, ID_Especie) VALUES (?, ?)', [raca, idEspecie]);
            idRaca = result.insertId;
        }

        const queryAnimal = 'INSERT INTO animal (Nome, ID_cliente, ID_Especie, ID_Raca) VALUES (?, ?, ?, ?)';
        await connection.execute(queryAnimal, [nome, idCliente, idEspecie, idRaca]);

        await connection.commit(); // Confirma a transação
        res.status(201).send('Animal cadastrado com sucesso!');

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Desfaz a transação em caso de erro
        }
        console.error('Erro ao cadastrar animal:', error);
        res.status(500).send('Erro ao cadastrar animal.');
    } finally {
        if (connection) {
            connection.release(); // Libera a conexão
        }
    }
});

module.exports = router;