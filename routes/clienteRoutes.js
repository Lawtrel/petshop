const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool, poolConnect } = require('../config/db');

// Garante que o pool de conexões está pronto antes de aceitar requisições
poolConnect.then(() => {
    console.log('Pool de conexões com SQL Server pronto para uso nas rotas de cliente.');
}).catch(err => console.error('Erro ao conectar o pool nas rotas de cliente', err));

/**
 * Rota para cadastrar um novo cliente e seu contato em uma única transação.
 */
router.post('/cadastrar-cliente', async (req, res) => {
    // Extrai os dados do corpo da requisição
    // Mantendo os nomes das variáveis do frontend para mapeamento
    const { nome, CPF, rua, estado, cep, telefone, celular, email } = req.body;

    // Inicia uma transação para garantir que ambas as inserções (cliente e contato) funcionem ou falhem juntas.
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        // 1. Inserir na tabela 'Cliente' e obter o ID gerado
        const queryCliente = `
            INSERT INTO Cliente (Nome, CPF, Rua, Estado, CEP)
            OUTPUT INSERTED.ClienteID
            VALUES (@nome, @cpf, @rua, @estado, @cep);
        `;

        const requestCliente = new sql.Request(transaction);
        // Mapeia as variáveis para os parâmetros nomeados da query de forma segura
        requestCliente.input('nome', sql.VarChar, nome);
        requestCliente.input('cpf', sql.Char(11), CPF); // Usando CHAR(11) conforme o novo BD
        requestCliente.input('rua', sql.VarChar, rua);
        requestCliente.input('estado', sql.Char(2), estado); // Usando CHAR(2)
        requestCliente.input('cep', sql.VarChar(8), cep); // Usando VARCHAR(8)

        const resultCliente = await requestCliente.query(queryCliente);
        const idClienteGerado = resultCliente.recordset[0].ClienteID;

        // 2. Inserir na tabela 'ClienteContato' usando o ID gerado
        const queryContato = `
            INSERT INTO ClienteContato (Telefone, Celular, Email, ClienteID)
            VALUES (@telefone, @celular, @email, @idCliente);
        `;
        const requestContato = new sql.Request(transaction);
        requestContato.input('telefone', sql.VarChar(15), telefone);
        requestContato.input('celular', sql.VarChar(15), celular);
        requestContato.input('email', sql.VarChar(255), email);
        requestContato.input('idCliente', sql.Int, idClienteGerado);
        
        await requestContato.query(queryContato);

        // Se tudo deu certo, confirma a transação
        await transaction.commit();
        console.log(`Cliente e contatos cadastrados com sucesso! ClienteID: ${idClienteGerado}`);
        res.status(201).send('Cliente cadastrado com sucesso!');

    } catch (error) {
        // Se algo deu errado, desfaz a transação
        await transaction.rollback();
        console.error('Erro ao cadastrar cliente:', error);
        
        // O código 2627 no SQL Server indica violação de chave única (UNIQUE)
        if (error.number === 2627) { 
            res.status(400).send('CPF ou Email já cadastrado.');
        } else {
            res.status(500).send('Erro ao cadastrar cliente.');
        }
    }
});

/**
 * Rota para listar todos os clientes com seus contatos.
 */
router.get('/clientes', async (req, res) => {
    try {
        const request = pool.request();
        // A query SQL foi ajustada para os novos nomes de colunas (padrão PascalCase)
        const query = `
            SELECT
                c.ClienteID,
                c.Nome,
                c.CPF,
                c.Rua,
                c.Estado,
                c.CEP,
                cc.Telefone,
                cc.Celular,
                cc.Email
            FROM
                Cliente c
            LEFT JOIN
                ClienteContato cc ON c.ClienteID = cc.ClienteID
            ORDER BY c.Nome;
        `;
        const result = await request.query(query);
        // O resultado da query fica na propriedade 'recordset'
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).send('Erro ao buscar clientes.');
    }
});

// Rota para LER (Listar) os animais de um cliente específico
router.get('/clientes/:id/animais', async (req, res) => {
    const { id } = req.params;
    try {
        const request = pool.request();
        request.input('ClienteID', sql.Int, id);
        const result = await request.query('SELECT AnimalID, Nome FROM Animal WHERE ClienteID = @ClienteID'); // Seleciona apenas o ID e Nome
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar animais do cliente:', error);
        res.status(500).send('Erro ao listar animais do cliente.');
    }
});

// Rota para DELETAR um cliente e seus dados relacionados em cascata
router.delete('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('ClienteID', sql.Int, id);

        // Ordem de exclusão devido a chaves estrangeiras, seguindo a nova estrutura do DB:
        // 1. Deletar registros de serviços de vendas associados a animais deste cliente
        // (Isso assume que VendaServico.AnimalID é a FK e Animal.ClienteID é a FK)
        // Isso requer uma subquery para pegar AnimalIDs associados a este ClienteID
        await request.query(`
            DELETE FROM VendaServico 
            WHERE AnimalID IN (SELECT AnimalID FROM Animal WHERE ClienteID = @ClienteID);
        `);

        // 2. Deletar registros de produtos de vendas associados a vendas deste cliente
        await request.query(`
            DELETE FROM VendaProduto 
            WHERE VendaID IN (SELECT VendaID FROM Venda WHERE ClienteID = @ClienteID);
        `);

        // 3. Deletar registros de vendas associados a este cliente
        await request.query('DELETE FROM Venda WHERE ClienteID = @ClienteID');

        // 4. Deletar registros de animais associados a este cliente
        await request.query('DELETE FROM Animal WHERE ClienteID = @ClienteID');

        // 5. Deletar registros de contato associados a este cliente
        await request.query('DELETE FROM ClienteContato WHERE ClienteID = @ClienteID');

        // 6. Finalmente, deletar o cliente da tabela Cliente
        const result = await request.query('DELETE FROM Cliente WHERE ClienteID = @ClienteID');

        if (result.rowsAffected[0] > 0) {
            await transaction.commit();
            res.status(200).send('Cliente e seus dados relacionados removidos com sucesso!');
        } else {
            await transaction.rollback();
            res.status(404).send('Cliente não encontrado.');
        }

    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao remover cliente:', error);
        res.status(500).send('Erro ao remover cliente. Verifique se há dependências não tratadas.');
    }
});

module.exports = router;
