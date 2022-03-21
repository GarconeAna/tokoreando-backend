const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authenticate = require('./auth');
const User = require('./model/User');
const Post = require('./model/Post');
const res = require('express/lib/response');

const router = new Router();

router.post("/register", async (req, res, next) => {
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

router.post("/login", async (req, res, next) => {
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

router.post('/posts', authenticate, async (req, res, next) => {
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

router.delete('/posts/:id', authenticate, async (req, res, next) => {
    const { id } = req.params;

    try {
        await Post.findByIdAndDelete(id);
        res.status(200).send({message: 'Post deleted.'})
    } catch (err) {
        res.status(400);
        next(err);
    }
});

router.put('/posts/:id', authenticate, async (req, res, next) => {
    // encontramos o post pelo parâmetro ID da url
    const { id } = req.params;

    try {
        const post = await Post.findById(id);

        if(!post) return res.status(400).send({error: 'Post not found.'});

        // vemos se o post em quetão pertence ao usuário que está logado
        if (post.owner === req.user._id) return res.status(400).send({error: 'Unable to update post.'});

        // verificar se esta post já foi curtido
        const postAlreadyLiked = post.likes.some(like => like == req.user._id);
    
        if (postAlreadyLiked) {
            post.likes = post.likes.filter(like => like != req.user._id);
        } else {
            post.likes.push(req.user_id);
        }
    
        post.save();
    
        res.status(200).send(post);
    } catch (err) {
        res.status(400);
        next(err);
    } 
});

router.get('/users', authenticate, async (req, res, next) => {
    try {
        const users = await User.find({});

        if (!users.length) return res.status(400).send({error: 'Unable to get users.'});

        res.status(200).send(users.map(user => (
            {
                _id: user.id,
                username: user.username
            }
        )))
    } catch (err) {
        res.status(400);
        next(err);
    }
});

router.get('/posts', authenticate, async (req, res, next) => {
    try {
        const posts = await Post.find({});
        res.status(200).send(posts);
    } catch (err) {
        res.status(400);
        next(err);
    }
});

router.get('/posts/:id', authenticate, async (req, res, next) => {
    const { id } = req.params;

    try {
        const post = await Post.findById(id);

        if (!post) return res.status(400).send({error: 'Post not found'});

        res.status(200).send(post);
    } catch (err) {
        res.status(400);
        next(err);
    }
});


module.exports = router;