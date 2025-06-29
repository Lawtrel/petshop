const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool } = require('../config/db');

// Rota para CRIAR uma nova forma de pagamento
router.post('/formas-pagamento', async (req, res) => {
    const { NomeFormaPagamento } = req.body;

    if (!NomeFormaPagamento) {
        return res.status(400).send('Nome da forma de pagamento é obrigatório.');
    }

    try {
        const request = pool.request();
        // A coluna no DB é 'NomeFormaPagamento'
        request.input('NomeFormaPagamento', sql.VarChar(50), NomeFormaPagamento);
        
        const query = 'INSERT INTO FormaPagamento (NomeFormaPagamento) VALUES (@NomeFormaPagamento)';
        
        await request.query(query);
        res.status(201).send('Forma de pagamento cadastrada com sucesso!');
    } catch (error) {
        console.error('Erro ao cadastrar forma de pagamento:', error);
        res.status(500).send('Erro ao cadastrar forma de pagamento.');
    }
});

// Rota para LER (Listar) todas as formas de pagamento
router.get('/formas-pagamento', async (req, res) => {
    try {
        const request = pool.request();
        // As colunas no DB são FormaPagamentoID e NomeFormaPagamento
        const result = await request.query('SELECT FormaPagamentoID, NomeFormaPagamento FROM FormaPagamento ORDER BY NomeFormaPagamento');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar formas de pagamento:', error);
        res.status(500).send('Erro ao listar formas de pagamento.');
    }
});

// Rota para ATUALIZAR uma forma de pagamento
router.put('/formas-pagamento/:id', async (req, res) => {
    const { id } = req.params;
    const { NomeFormaPagamento } = req.body;

    if (!NomeFormaPagamento) {
        return res.status(400).send('Nome da forma de pagamento é obrigatório.');
    }

    try {
        const request = pool.request();
        request.input('FormaPagamentoID', sql.Int, id);
        request.input('NomeFormaPagamento', sql.VarChar(50), NomeFormaPagamento);

        const query = `
            UPDATE FormaPagamento 
            SET NomeFormaPagamento = @NomeFormaPagamento
            WHERE FormaPagamentoID = @FormaPagamentoID
        `;
        
        const result = await request.query(query);
        if (result.rowsAffected[0] > 0) {
            res.status(200).send('Forma de pagamento atualizada com sucesso!');
        } else {
            res.status(404).send('Forma de pagamento não encontrada.');
        }
    } catch (error) {
        console.error('Erro ao atualizar forma de pagamento:', error);
        res.status(500).send('Erro ao atualizar forma de pagamento.');
    }
});

// Rota para DELETAR uma forma de pagamento
router.delete('/formas-pagamento/:id', async (req, res) => {
    const { id } = req.params;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('FormaPagamentoID', sql.Int, id);
        
        // Primeiro, deletar registros na Venda que referenciam esta FormaPagamento
        await request.query('DELETE FROM Venda WHERE FormaPagamentoID = @FormaPagamentoID');

        // Agora, deletar a forma de pagamento da tabela FormaPagamento
        const result = await request.query('DELETE FROM FormaPagamento WHERE FormaPagamentoID = @FormaPagamentoID');
        
        if (result.rowsAffected[0] > 0) {
            await transaction.commit();
            res.status(200).send('Forma de pagamento deletada com sucesso!');
        } else {
            await transaction.rollback();
            res.status(404).send('Forma de pagamento não encontrada.');
        }
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao deletar forma de pagamento:', error);
        res.status(500).send('Erro ao deletar forma de pagamento. Verifique se ela não está associada a alguma venda.');
    }
});

module.exports = router;
