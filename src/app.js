const express = require('express');

const morgan = require('morgan');

const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const User = require('./model/User');
// const Tweet = require('./model/tweet.model');



const cors = require('cors');
const { append } = require('express/lib/response');
const bcrypt = require('bcryptjs/dist/bcrypt');


mongoose
.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true})
.then(() => console.log("Database connected!"))
.catch(err => console.log(err));

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

app.post("/register", async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        console.log(username);
        console.log(password);
        
        const userExists = await User.findOne({ username });

        console.log(userExists);

        if (userExists) return res.status(400).send({error:"Username already in use."});

        const user = await User.create({
            username,
            password: hash
        })

        console.log(user);

        res.status(201).send({
            id: user.id,
            username: user.username
        });
    } catch (err) {
        res.status(400)
        next(err);
    }
});


const PORT = 3333;

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});