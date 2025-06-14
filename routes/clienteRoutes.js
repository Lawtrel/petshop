const express = require('express');
const router = express.Router();
const sql = require('mssql'); // Importa o driver do SQL Server
const { pool, poolConnect } = require('../config/db'); // Importa o pool de conexão

// Garante que o pool de conexões está pronto antes de aceitar requisições
poolConnect.then(() => {
    console.log('Pool de conexões com SQL Server pronto para uso nas rotas de cliente.');
}).catch(err => console.error('Erro ao conectar o pool nas rotas de cliente', err));

/**
 * Rota para cadastrar um novo cliente e seu contato em uma única transação.
 */
router.post('/cadastrar-cliente', async (req, res) => {
    // Extrai os dados do corpo da requisição
    const { nome, cpf, rua, estado, cep, tel, cel, email } = req.body;

    // Inicia uma transação para garantir que ambas as inserções (cliente e contato) funcionem ou falhem juntas.
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        // 1. Inserir na tabela 'Cliente' e obter o ID gerado
        // A cláusula "OUTPUT INSERTED.ClienteID" é a forma do SQL Server de retornar o ID recém-criado.
        const queryCliente = `
            INSERT INTO Cliente (Nome, CPF, Rua, Estado, CEP)
            OUTPUT INSERTED.ClienteID
            VALUES (@nome, @cpf, @rua, @estado, @cep);
        `;

        const requestCliente = new sql.Request(transaction);
        // Mapeia as variáveis para os parâmetros nomeados da query de forma segura
        requestCliente.input('nome', sql.VarChar, nome);
        requestCliente.input('cpf', sql.Char, cpf); // Usando CHAR(11) conforme o novo BD
        requestCliente.input('rua', sql.VarChar, rua);
        requestCliente.input('estado', sql.Char, estado); // Usando CHAR(2)
        requestCliente.input('cep', sql.VarChar, cep);

        const resultCliente = await requestCliente.query(queryCliente);
        const idClienteGerado = resultCliente.recordset[0].ClienteID;

        // 2. Inserir na tabela 'ClienteContato' usando o ID gerado
        const queryContato = `
            INSERT INTO ClienteContato (Telefone, Celular, Email, ClienteID)
            VALUES (@tel, @cel, @email, @idCliente);
        `;
        const requestContato = new sql.Request(transaction);
        requestContato.input('tel', sql.VarChar, tel);
        requestContato.input('cel', sql.VarChar, cel);
        requestContato.input('email', sql.VarChar, email);
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
        const result = await request.query('SELECT * FROM Animal WHERE ClienteID = @ClienteID');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar animais do cliente:', error);
        res.status(500).send('Erro ao listar animais do cliente.');
    }
});

module.exports = router;