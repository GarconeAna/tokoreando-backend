const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const router = require('./routes');
const middlewares = require('./middleware');

const app = express();

app.use(morgan('common'));
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3000"
    })
);

mongoose
.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true})
.then(() => console.log("Database connected!"))
.catch(err => console.log(err));

app.use(router);

const { append, send } = require('express/lib/response');
const bcrypt = require('bcryptjs/dist/bcrypt');

// recurso não encontrado
app.use(middlewares.notFound);

//tratamento de erro
app.use(middlewares.errorHandling);

const PORT = 3333;

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});