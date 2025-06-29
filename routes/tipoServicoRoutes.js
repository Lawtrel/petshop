const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool } = require('../config/db');

// Rota para CRIAR um novo tipo de serviço
router.post('/tipos-servico', async (req, res) => {
    const { NomeTipoServico } = req.body; // Usa NomeTipoServico

    if (!NomeTipoServico) {
        return res.status(400).send('Nome do tipo de serviço é obrigatório.');
    }

    try {
        const request = pool.request();
        request.input('NomeTipoServico', sql.VarChar(125), NomeTipoServico); // Coluna no DB é NomeTipoServico
        
        const query = 'INSERT INTO TipoServico (NomeTipoServico) VALUES (@NomeTipoServico)'; // Tabela é TipoServico
        
        await request.query(query);
        res.status(201).send('Tipo de serviço cadastrado com sucesso!');
    } catch (error) {
        console.error('Erro ao cadastrar tipo de serviço:', error);
        res.status(500).send('Erro ao cadastrar tipo de serviço.');
    }
});

// Rota para LER (Listar) todos os tipos de serviço
router.get('/tipos-servico', async (req, res) => {
    try {
        const request = pool.request();
        // Colunas no DB são TipoServicoID e NomeTipoServico
        const result = await request.query('SELECT TipoServicoID, NomeTipoServico FROM TipoServico ORDER BY NomeTipoServico');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar tipos de serviço:', error);
        res.status(500).send('Erro ao listar tipos de serviço.');
    }
});

// Rota para ATUALIZAR um tipo de serviço
router.put('/tipos-servico/:id', async (req, res) => {
    const { id } = req.params;
    const { NomeTipoServico } = req.body; // Usa NomeTipoServico

    if (!NomeTipoServico) {
        return res.status(400).send('Nome do tipo de serviço é obrigatório.');
    }

    try {
        const request = pool.request();
        request.input('TipoServicoID', sql.Int, id);
        request.input('NomeTipoServico', sql.VarChar(125), NomeTipoServico); // Coluna no DB é NomeTipoServico

        const query = `
            UPDATE TipoServico 
            SET NomeTipoServico = @NomeTipoServico
            WHERE TipoServicoID = @TipoServicoID
        `;
        
        const result = await request.query(query);
        if (result.rowsAffected[0] > 0) {
            res.status(200).send('Tipo de serviço atualizado com sucesso!');
        } else {
            res.status(404).send('Tipo de serviço não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao atualizar tipo de serviço:', error);
        res.status(500).send('Erro ao atualizar tipo de serviço.');
    }
});

// Rota para DELETAR um tipo de serviço
router.delete('/tipos-servico/:id', async (req, res) => {
    const { id } = req.params;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('TipoServicoID', sql.Int, id);
        
        // Primeiro, verificar e deletar serviços que dependem deste TipoServico
        await request.query('DELETE FROM Servico WHERE TipoServicoID = @TipoServicoID');

        // Agora, deletar o tipo de serviço
        const result = await request.query('DELETE FROM TipoServico WHERE TipoServicoID = @TipoServicoID');
        
        if (result.rowsAffected[0] > 0) {
            await transaction.commit();
            res.status(200).send('Tipo de serviço deletado com sucesso!');
        } else {
            await transaction.rollback();
            res.status(404).send('Tipo de serviço não encontrado.');
        }
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao deletar tipo de serviço:', error);
        res.status(500).send('Erro ao deletar tipo de serviço. Verifique se ele não está associado a algum serviço.');
    }
});

module.exports = router;
