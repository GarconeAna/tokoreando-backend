const express = require('express');

const morgan = require('morgan');

const cors = require('cors');
const { append } = require('express/lib/response');

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000"
    })
)

app.use(morgan('common'));

app.use(express.json());

app.use((error, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.statusCode = statusCode;
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === "production" ? "ok": error.stack
    });
});

app.get('/', (req, res) => {
    res.send('Helloooooo!!!!!');
});

const PORT = 3333;

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});