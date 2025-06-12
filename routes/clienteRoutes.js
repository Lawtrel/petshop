const express = require('express');
const router = express.Router();
const dbConnection = require('../config/db');

router.post('/cadastrar-cliente', async (req, res) => {
    const { nome, cpf, rua, estado, cep, tel, cel, email} = req.body;

    /*if (!nome || !cpf || !rua || !estado || !cep || !tel || !cel || !email) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }*/

        let connection;

    try {
        connection = await dbConnection.getConnection();
        await connection.beginTransaction();
        

        const query = 'INSERT INTO cliente (Nome, CPF, Rua, Estado, CEP) VALUES (?, ?, ?, ?, ?)';
        const [resultCliente] = await connection.execute(query, [nome, cpf, rua, estado, cep]);
        const idClienteGerado = resultCliente.insertId;

        const sqlContato = 'INSERT INTO cliente_contato (Tel, Cel, Email, ID_Cliente) VALUES (?, ?, ?, ?)';
        await connection.execute(sqlContato, [tel, cel, email, idClienteGerado]);
        await connection.commit();

        console.log(`Cliente e contatos cadastrados com sucesso! ID_Cliente: ${idClienteGerado}`);
        res.send('Cliente cadastrado com sucesso!');
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Erro ao cadastrar cliente:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('CPF já cadastrado.');
        } else if (error.sqlMessage.includes('Email')) {
            return res.status(400).send('Email já cadastrado.');
        }
        res.status(500).send('Erro ao cadastrar cliente.');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

router.get('/clientes', async (req, res) => {
    let connection;
    try {
        connection = await dbConnection.getConnection();
        const [rows] = await connection.execute(`
            SELECT
                c.ID_Cliente,
                c.Nome,
                c.CPF,
                c.Rua,
                c.Estado,
                c.CEP,
                cc.Tel,
                cc.Cel,
                cc.Email
            FROM
                cliente c
            JOIN
                cliente_contato cc ON c.ID_Cliente = cc.ID_Cliente
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).send('Erro ao buscar clientes.');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});