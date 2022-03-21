const express = require('express');

const morgan = require('morgan');

const mongoose = require('mongoose');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const authenticate = require('./auth');
const app = express();

const User = require('./model/User');
const Post = require('./model/Post');



const cors = require('cors');
const { append, send } = require('express/lib/response');
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

app.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) return res.status(400).send({error: "Username not found."});

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) return res.status(400).send({error: "Invalid password."});

        const token = jwt.sign({_id: user.id}, process.env.JWT_SECRET);
        res.header('auth-token', token).send(token);

        res.send({message: "User logged in."});
    } catch (err) {
        res.status(400);
        next(err);
    }
});

app.post('/posts', authenticate, async (req, res, next) => {
    const { content } = req.body;

    try {
        const post = await Post.create({owner: req.user, content});
        if(!post) res.status(400).send({error: 'Unable to create post.'});
        res.status(201).send(post);
    } catch (err) {
        res.status(400);
        send(err);
    }
});


const PORT = 3333;

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});