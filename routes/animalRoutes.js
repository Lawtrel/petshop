const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool, poolConnect} = require('../config/db');

poolConnect.then(() => {
    console.log('pronto para uso nas rotas de animal.');
}).catch(err => console.error('Erro ao conectar o pool nas rotas de animal', err));


router.post('/animais', async (req, res) => {
    const { idCliente, nome, especie, raca } = req.body;
    //validacao
    if (!idCliente || !nome || !especie || !raca) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        request.input('especieNome', sql.VarChar, especie);
        let resultEspecie = await request.query('SELECT ID_Especie FROM especie WHERE Especie = @especieNome');
        let idEspecie;
        if (resultEspecie.recordset.length > 0) {
            idEspecie = resultEspecie.recordset[0].ID_Especie;
        } else {
            resultEspecie = await request.query('INSERT INTO especie (Especie) OUTPUT INSERTED.ID_Especie VALUES (@especieNome)');
            idEspecie = resultEspecie.recordset[0].ID_Especie;
        }

        const requestRaca = new sql.Request(transaction);
        requestRaca.input('racaNome', sql.VarChar, raca);
        requestRaca.input('idEspecieRaca', sql.Int, idEspecie);
        let resultRaca = await requestRaca.query('SELECT ID_Raca FROM raca WHERE Nome = @racaNome AND ID_Especie = @idEspecieRaca');
        let idRaca;
        if (resultRaca.recordset.length > 0) {
            idRaca = resultRaca.recordset[0].ID_Raca;
        } else {
            resultRaca = await requestRaca.query('INSERT INTO raca (Nome, ID_Especie) OUTPUT INSERTED.ID_Raca VALUES (@racaNome, @idEspecieRaca)');
            idRaca = resultRaca.recordset[0].ID_Raca;
        }

        // Insere o Animal
        const requestAnimal = new sql.Request(transaction);
        requestAnimal.input('animalNome', sql.VarChar, nome);
        requestAnimal.input('animalClienteID', sql.Int, idCliente);
        requestAnimal.input('animalEspecieID', sql.Int, idEspecie);
        requestAnimal.input('animalRacaID', sql.Int, idRaca);
        await requestAnimal.query('INSERT INTO animal (Nome, ID_cliente, ID_Especie, ID_Raca) VALUES (@animalNome, @animalClienteID, @animalEspecieID, @animalRacaID)');
        
        await transaction.commit();
        res.status(201).send('Animal cadastrado com sucesso!');

    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao cadastrar animal:', error);
        res.status(500).send('Erro ao cadastrar animal.');
    }
});

module.exports = router;