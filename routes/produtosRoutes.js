const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool } = require('../config/db');

// Rota para CRIAR um novo produto
router.post('/produtos', async (req, res) => {
    const { NomeProduto, Preco, QuantidadeEstoque } = req.body;

    if (!NomeProduto || Preco === undefined || QuantidadeEstoque === undefined) {
        return res.status(400).send('Nome, Preço e Quantidade são obrigatórios.');
    }

    try {
        const request = pool.request();
        request.input('NomeProduto', sql.VarChar, NomeProduto);
        request.input('Preco', sql.Decimal(10, 2), Preco);
        request.input('QuantidadeEstoque', sql.Int, QuantidadeEstoque);
        
        const query = 'INSERT INTO Produto (NomeProduto, Preco, QuantidadeEstoque) VALUES (@NomeProduto, @Preco, @QuantidadeEstoque)';
        
        await request.query(query);
        res.status(201).send('Produto cadastrado com sucesso!');
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        res.status(500).send('Erro ao cadastrar produto.');
    }
});

// Rota para LER (Listar) todos os produtos
router.get('/produtos', async (req, res) => {
    try {
        const request = pool.request();
        const result = await request.query('SELECT * FROM Produto ORDER BY NomeProduto');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).send('Erro ao listar produtos.');
    }
});

// Rota para LER (Buscar) um produto por ID
router.get('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const request = pool.request();
        request.input('ProdutoID', sql.Int, id);
        const result = await request.query('SELECT * FROM Produto WHERE ProdutoID = @ProdutoID');
        
        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).send('Produto não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).send('Erro ao buscar produto.');
    }
});

// Rota para ATUALIZAR um produto
router.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { NomeProduto, Preco, QuantidadeEstoque } = req.body;

    try {
        const request = pool.request();
        request.input('ProdutoID', sql.Int, id);
        request.input('NomeProduto', sql.VarChar, NomeProduto);
        request.input('Preco', sql.Decimal(10, 2), Preco);
        request.input('QuantidadeEstoque', sql.Int, QuantidadeEstoque);

        const query = `
            UPDATE Produto 
            SET NomeProduto = @NomeProduto, Preco = @Preco, QuantidadeEstoque = @QuantidadeEstoque
            WHERE ProdutoID = @ProdutoID
        `;
        
        const result = await request.query(query);
        // result.rowsAffected[0] retorna o número de linhas alteradas
        if (result.rowsAffected[0] > 0) {
            res.status(200).send('Produto atualizado com sucesso!');
        } else {
            res.status(404).send('Produto não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).send('Erro ao atualizar produto.');
    }
});

// Rota para DELETAR um produto
router.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const request = pool.request();
        request.input('ProdutoID', sql.Int, id);
        
        const result = await request.query('DELETE FROM Produto WHERE ProdutoID = @ProdutoID');
        
        if (result.rowsAffected[0] > 0) {
            res.status(200).send('Produto deletado com sucesso!');
        } else {
            res.status(404).send('Produto não encontrado.');
        }
    } catch (error) {
        // Códigos de erro específicos podem indicar que o produto está em uso em uma venda
        console.error('Erro ao deletar produto:', error);
        res.status(500).send('Erro ao deletar produto. Verifique se ele não está associado a uma venda.');
    }
});

module.exports = router;