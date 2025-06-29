
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

//rotas
const clienteRoutes = require('./routes/clienteRoutes');
const animalRoutes = require('./routes/animalRoutes');
const produtosRoutes = require('./routes/produtosRoutes');
const servicosRoutes = require('./routes/servicosRoutes');
const vendasRoutes = require('./routes/vendasRoutes');
const formaPagamentoRoutes = require('./routes/formaPagamentoRoutes')
const tipoServicoRoutes = require('./routes/tipoServicoRoutes');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', clienteRoutes);
app.use('/api', animalRoutes);
app.use('/api', produtosRoutes);
app.use('/api', servicosRoutes);
app.use('/api', vendasRoutes);
app.use('/api', formaPagamentoRoutes);
app.use('/api', tipoServicoRoutes);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(8080, () => {
    console.log('Servidor rodando na porta 8080');
});