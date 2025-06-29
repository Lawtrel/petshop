const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool } = require('../config/db');

// Rota para CRIAR um novo serviço
router.post('/servicos', async (req, res) => {
    const { NomeServico, Descricao, Preco, TipoServicoID } = req.body;

    if (!NomeServico || Preco === undefined || TipoServicoID === undefined) {
        return res.status(400).send('Nome, Preço e Tipo de Serviço são obrigatórios.');
    }

    try {
        const request = pool.request();
        request.input('NomeServico', sql.VarChar(100), NomeServico);
        request.input('Descricao', sql.VarChar(255), Descricao);
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

// Rota para LER (Listar) todos os serviços com o nome do tipo de serviço
router.get('/servicos', async (req, res) => {
    try {
        const request = pool.request();
        const query = `
            SELECT 
                s.ServicoID, 
                s.NomeServico, 
                s.Descricao, 
                s.Preco, 
                s.TipoServicoID,
                ts.NomeTipoServico -- Retorna o nome do tipo de serviço
            FROM 
                Servico s
            JOIN 
                TipoServico ts ON s.TipoServicoID = ts.TipoServicoID
            ORDER BY s.NomeServico;
        `;
        const result = await request.query(query);
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

    if (!NomeServico || Preco === undefined || TipoServicoID === undefined) {
        return res.status(400).send('Nome, Preço e Tipo de Serviço são obrigatórios.');
    }

    try {
        const request = pool.request();
        request.input('ServicoID', sql.Int, id);
        request.input('NomeServico', sql.VarChar(100), NomeServico);
        request.input('Descricao', sql.VarChar(255), Descricao);
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
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('ServicoID', sql.Int, id);
        
        // Primeiro, deletar registros na VendaServico que referenciam este Servico
        await request.query('DELETE FROM VendaServico WHERE ServicoID = @ServicoID');

        // Agora, deletar o serviço da tabela Servico
        const result = await request.query('DELETE FROM Servico WHERE ServicoID = @ServicoID');
        
        if (result.rowsAffected[0] > 0) {
            await transaction.commit();
            res.status(200).send('Serviço deletado com sucesso!');
        } else {
            await transaction.rollback();
            res.status(404).send('Serviço não encontrado.');
        }
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao deletar serviço:', error);
        res.status(500).send('Erro ao deletar serviço. Verifique se ele não está associado a uma venda.');
    }
});

module.exports = router;
