const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool } = require('../config/db');

// Rota para CRIAR uma nova venda
router.post('/vendas', async (req, res) => {
    const { ClienteID, FormaPagamentoID, ValorTotal, produtos, servicos } = req.body;
    
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        // 1. Inserir na tabela Venda principal e obter o ID da Venda
        const vendaQuery = `
            INSERT INTO Venda (ClienteID, FormaPagamentoID, ValorTotal, DataVenda) 
            OUTPUT INSERTED.VendaID
            VALUES (@ClienteID, @FormaPagamentoID, @ValorTotal, GETDATE())
        `;
        const vendaRequest = new sql.Request(transaction);
        vendaRequest.input('ClienteID', sql.Int, ClienteID);
        vendaRequest.input('FormaPagamentoID', sql.Int, FormaPagamentoID);
        vendaRequest.input('ValorTotal', sql.Decimal(10, 2), ValorTotal);
        
        const vendaResult = await vendaRequest.query(vendaQuery);
        const novaVendaID = vendaResult.recordset[0].VendaID;

        // 2. Inserir cada produto da venda na tabela VendaProduto
        if (produtos && produtos.length > 0) {
            for (const produto of produtos) {
                const produtoRequest = new sql.Request(transaction);
                produtoRequest.input('VendaID', sql.Int, novaVendaID);
                produtoRequest.input('ProdutoID', sql.Int, produto.ProdutoID);
                produtoRequest.input('Quantidade', sql.Int, produto.Quantidade);
                produtoRequest.input('PrecoUnitario', sql.Decimal(10, 2), produto.PrecoUnitario);

                await produtoRequest.query(`
                    INSERT INTO VendaProduto (VendaID, ProdutoID, Quantidade, PrecoUnitario) 
                    VALUES (@VendaID, @ProdutoID, @Quantidade, @PrecoUnitario)
                `);

                // Opcional: Atualizar estoque
                await produtoRequest.query(`
                    UPDATE Produto SET QuantidadeEstoque = QuantidadeEstoque - @Quantidade WHERE ProdutoID = @ProdutoID
                `);
            }
        }

        // 3. Inserir cada serviço da venda na tabela VendaServico
        if (servicos && servicos.length > 0) {
            for (const servico of servicos) {
                const servicoRequest = new sql.Request(transaction);
                servicoRequest.input('VendaID', sql.Int, novaVendaID);
                servicoRequest.input('ServicoID', sql.Int, servico.ServicoID);
                servicoRequest.input('AnimalID', sql.Int, servico.AnimalID);
                servicoRequest.input('PrecoCobrado', sql.Decimal(10, 2), servico.PrecoCobrado);
                
                await servicoRequest.query(`
                    INSERT INTO VendaServico (VendaID, ServicoID, AnimalID, PrecoCobrado)
                    VALUES (@VendaID, @ServicoID, @AnimalID, @PrecoCobrado)
                `);
            }
        }

        await transaction.commit();
        res.status(201).json({ message: 'Venda registrada com sucesso!', vendaId: novaVendaID });

    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao registrar venda:", error);
        res.status(500).send('Erro ao registrar venda.');
    }
});

// Rota para LER (Listar) todas as vendas
router.get('/vendas', async (req, res) => {
    try {
        const request = pool.request();
        const query = `
            SELECT v.VendaID, v.DataVenda, v.ValorTotal, c.Nome AS NomeCliente, fp.NomeFormaPagamento 
            FROM Venda v
            JOIN Cliente c ON v.ClienteID = c.ClienteID
            JOIN FormaPagamento fp ON v.FormaPagamentoID = fp.FormaPagamentoID
            ORDER BY v.DataVenda DESC
        `;
        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar vendas:', error);
        res.status(500).send('Erro ao listar vendas.');
    }
});


module.exports = router;