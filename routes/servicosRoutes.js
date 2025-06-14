const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool } = require('../config/db');

// Rota para CRIAR um novo serviço
router.post('/servicos', async (req, res) => {
    const { NomeServico, Descricao, Preco, TipoServicoID } = req.body;

    try {
        const request = pool.request();
        request.input('NomeServico', sql.VarChar, NomeServico);
        request.input('Descricao', sql.VarChar, Descricao);
        request.input('Preco', sql.Decimal(10, 2), Preco);
        request.input('TipoServicoID', sql.Int, TipoServicoID);
        
        const query = 'INSERT INTO Servico (NomeServico, Descricao, Preco, TipoServicoID) VALUES (@NomeServico, @Descricao, @Preco, @TipoServicoID)';
        
        await request.query(query);
        res.status(201).send('Serviço cadastrado com sucesso!');
    } catch (error) {
        console.error('Erro ao cadastrar serviço:', error);
        res.status(500).send('Erro ao cadastrar serviço.');
    }
});

// Rota para LER (Listar) todos os serviços
router.get('/servicos', async (req, res) => {
    try {
        const request = pool.request();
        const result = await request.query('SELECT * FROM Servico ORDER BY NomeServico');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar serviços:', error);
        res.status(500).send('Erro ao listar serviços.');
    }
});

// Rota para ATUALIZAR um serviço
router.put('/servicos/:id', async (req, res) => {
    const { id } = req.params;
    const { NomeServico, Descricao, Preco, TipoServicoID } = req.body;

    try {
        const request = pool.request();
        request.input('ServicoID', sql.Int, id);
        request.input('NomeServico', sql.VarChar, NomeServico);
        request.input('Descricao', sql.VarChar, Descricao);
        request.input('Preco', sql.Decimal(10, 2), Preco);
        request.input('TipoServicoID', sql.Int, TipoServicoID);

        const query = `
            UPDATE Servico 
            SET NomeServico = @NomeServico, Descricao = @Descricao, Preco = @Preco, TipoServicoID = @TipoServicoID
            WHERE ServicoID = @ServicoID
        `;
        
        const result = await request.query(query);
        if (result.rowsAffected[0] > 0) {
            res.status(200).send('Serviço atualizado com sucesso!');
        } else {
            res.status(404).send('Serviço não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        res.status(500).send('Erro ao atualizar serviço.');
    }
});

// Rota para DELETAR um serviço
router.delete('/servicos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const request = pool.request();
        request.input('ServicoID', sql.Int, id);
        
        const result = await request.query('DELETE FROM Servico WHERE ServicoID = @ServicoID');
        
        if (result.rowsAffected[0] > 0) {
            res.status(200).send('Serviço deletado com sucesso!');
        } else {
            res.status(404).send('Serviço não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao deletar serviço:', error);
        res.status(500).send('Erro ao deletar serviço.');
    }
});

module.exports = router;