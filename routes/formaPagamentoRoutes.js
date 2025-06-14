const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool } = require('../config/db');

router.get('/formas-pagamento', async (req, res) => {
    try {
        const request = pool.request();
        const result = await request.query('SELECT * FROM FormaPagamento');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Erro ao listar formas de pagamento:', error);
        res.status(500).send('Erro ao listar formas de pagamento.');
    }
});

module.exports = router;