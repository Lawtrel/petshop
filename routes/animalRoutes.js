const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool, poolConnect} = require('../config/db');

poolConnect.then(() => {
    console.log('Pool de conexões com SQL Server pronto para uso nas rotas de animal.');
}).catch(err => console.error('Erro ao conectar o pool nas rotas de animal', err));

// Rota para CRIAR um novo animal
router.post('/animais', async (req, res) => {
    // A nova estrutura da tabela Animal NÃO POSSUI DataNascimento, então removemos daqui.
    const { ClienteID, Nome, Especie, Raca } = req.body;

    // Validação de campos obrigatórios (Raça agora é opcional, se não for obrigatório no DB)
    if (!ClienteID || !Nome || !Especie) {
        return res.status(400).send('Nome do cliente, nome do animal e espécie são obrigatórios.');
    }

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1. Verificar/Inserir Espécie
        request.input('nomeEspecie', sql.VarChar, Especie);
        let resultEspecie = await request.query('SELECT EspecieID FROM Especie WHERE NomeEspecie = @nomeEspecie');
        let idEspecie;
        if (resultEspecie.recordset.length > 0) {
            idEspecie = resultEspecie.recordset[0].EspecieID;
        } else {
            // Inserir nova espécie e obter o ID gerado
            resultEspecie = await request.query('INSERT INTO Especie (NomeEspecie) OUTPUT INSERTED.EspecieID VALUES (@nomeEspecie)');
            idEspecie = resultEspecie.recordset[0].EspecieID;
        }

        // 2. Verificar/Inserir Raça (apenas se a raça for fornecida)
        let idRaca = null; // Inicializa como null, pois Raca é opcional
        if (Raca) { // Se o campo Raça foi preenchido
            const requestRaca = new sql.Request(transaction);
            requestRaca.input('nomeRaca', sql.VarChar, Raca);
            requestRaca.input('especieIdRaca', sql.Int, idEspecie); // Raça depende da Espécie

            let resultRaca = await requestRaca.query('SELECT RacaID FROM Raca WHERE NomeRaca = @nomeRaca AND EspecieID = @especieIdRaca');
            if (resultRaca.recordset.length > 0) {
                idRaca = resultRaca.recordset[0].RacaID;
            } else {
                // Inserir nova raça e obter o ID gerado
                resultRaca = await requestRaca.query('INSERT INTO Raca (NomeRaca, EspecieID) OUTPUT INSERTED.RacaID VALUES (@nomeRaca, @especieIdRaca)');
                idRaca = resultRaca.recordset[0].RacaID;
            }
        }
        
        // 3. Inserir o Animal
        const requestAnimal = new sql.Request(transaction);
        requestAnimal.input('nomeAnimal', sql.VarChar, Nome);
        requestAnimal.input('clienteID', sql.Int, ClienteID);
        requestAnimal.input('especieID', sql.Int, idEspecie);
        requestAnimal.input('racaID', sql.Int, idRaca); // idRaca pode ser NULL

        // A query INSERT INTO animal NÃO CONTÉM DataNascimento
        await requestAnimal.query('INSERT INTO Animal (Nome, ClienteID, EspecieID, RacaID) VALUES (@nomeAnimal, @clienteID, @especieID, @racaID)');
        
        await transaction.commit();
        res.status(201).send('Animal cadastrado com sucesso!');

    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao cadastrar animal:', error);
        res.status(500).send('Erro ao cadastrar animal.');
    }
});

// Rota para LER (Listar) todos os animais
router.get('/animais', async (req, res) => {
    try {
        const request = pool.request();
        const query = `
            SELECT
                a.AnimalID,
                a.Nome AS NomeAnimal, -- Alterado para evitar conflito com Cliente.Nome
                c.Nome AS NomeCliente,
                e.NomeEspecie AS Especie, -- Coluna renomeada na nova estrutura
                r.NomeRaca AS Raca,    -- Coluna renomeada na nova estrutura
                a.ClienteID
            FROM
                Animal a
            LEFT JOIN
                Cliente c ON a.ClienteID = c.ClienteID
            LEFT JOIN
                Especie e ON a.EspecieID = e.EspecieID
            LEFT JOIN
                Raca r ON a.RacaID = r.RacaID
            ORDER BY a.Nome; -- Ordenar pelo nome do animal
        `;
        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar animais:', error);
        res.status(500).send('Erro ao listar animais.');
    }
});

// Rota para ATUALIZAR um animal
router.put('/animais/:id', async (req, res) => {
    // A nova estrutura da tabela Animal NÃO POSSUI DataNascimento, então removemos daqui.
    const { id } = req.params;
    const { ClienteID, Nome, Especie, Raca } = req.body;

    if (!ClienteID || !Nome || !Especie) { // Raça continua opcional
        return res.status(400).send('Nome do cliente, nome do animal e espécie são obrigatórios.');
    }

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1. Verificar/Inserir Espécie (mesma lógica do POST)
        request.input('nomeEspecie', sql.VarChar, Especie);
        let resultEspecie = await request.query('SELECT EspecieID FROM Especie WHERE NomeEspecie = @nomeEspecie');
        let idEspecie;
        if (resultEspecie.recordset.length > 0) {
            idEspecie = resultEspecie.recordset[0].EspecieID;
        } else {
            resultEspecie = await request.query('INSERT INTO Especie (NomeEspecie) OUTPUT INSERTED.EspecieID VALUES (@nomeEspecie)');
            idEspecie = resultEspecie.recordset[0].EspecieID;
        }

        // 2. Verificar/Inserir Raça (mesma lógica do POST)
        let idRaca = null;
        if (Raca) {
            const requestRaca = new sql.Request(transaction);
            requestRaca.input('nomeRaca', sql.VarChar, Raca);
            requestRaca.input('especieIdRaca', sql.Int, idEspecie);

            let resultRaca = await requestRaca.query('SELECT RacaID FROM Raca WHERE NomeRaca = @nomeRaca AND EspecieID = @especieIdRaca');
            if (resultRaca.recordset.length > 0) {
                idRaca = resultRaca.recordset[0].RacaID;
            } else {
                resultRaca = await requestRaca.query('INSERT INTO Raca (NomeRaca, EspecieID) OUTPUT INSERTED.RacaID VALUES (@nomeRaca, @especieIdRaca)');
                idRaca = resultRaca.recordset[0].RacaID;
            }
        }

        // 3. Atualizar o Animal
        const requestAnimal = new sql.Request(transaction);
        requestAnimal.input('animalID', sql.Int, id);
        requestAnimal.input('nomeAnimal', sql.VarChar, Nome);
        requestAnimal.input('clienteID', sql.Int, ClienteID);
        requestAnimal.input('especieID', sql.Int, idEspecie);
        requestAnimal.input('racaID', sql.Int, idRaca); // idRaca pode ser NULL

        const query = `
            UPDATE Animal
            SET Nome = @nomeAnimal, ClienteID = @clienteID, EspecieID = @especieID, RacaID = @racaID
            WHERE AnimalID = @animalID
        `;
        
        const result = await requestAnimal.query(query);
        if (result.rowsAffected[0] > 0) {
            await transaction.commit();
            res.status(200).send('Animal atualizado com sucesso!');
        } else {
            await transaction.rollback();
            res.status(404).send('Animal não encontrado.');
        }
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao atualizar animal:', error);
        res.status(500).send('Erro ao atualizar animal.');
    }
});

// Rota para DELETAR um animal
router.delete('/animais/:id', async (req, res) => {
    const { id } = req.params;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('animalID', sql.Int, id);

        // Primeiro, deletar registros na VendaServico que referenciam este Animal
        await request.query('DELETE FROM VendaServico WHERE AnimalID = @animalID');

        // Agora, deletar o animal da tabela Animal
        const result = await request.query('DELETE FROM Animal WHERE AnimalID = @animalID');

        if (result.rowsAffected[0] > 0) {
            await transaction.commit();
            res.status(200).send('Animal deletado com sucesso!');
        } else {
            await transaction.rollback();
            res.status(404).send('Animal não encontrado.');
        }
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao deletar animal:', error);
        res.status(500).send('Erro ao deletar animal. Verifique se ele está associado a outros registros.');
    }
});

module.exports = router;
