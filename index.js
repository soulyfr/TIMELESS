const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const { readFileSync } = require('fs');
const { readFile } = require('fs').promises;
const path = require('path');

const url  = process.env.MONGODB_URI;

const app = express();

app.use(express.json());
app.use(express.static('public'));

const client = new  MongoClient(url);
let db;
const dbName = 'leaderboard';
const collectionName = 'high_scores';

const dictionary = new Set();

try {
    const data = readFileSync('words_dictionary.json', 'utf-8');
    const rawDict = JSON.parse(data);
    
    Object.keys(rawDict).forEach(word => dictionary.add(word));


} catch (error) {
    console.error(error);
}

connectDB();

app.get('/api/top-10', async (req, res) => {
    const collection = db.collection(collectionName);

    const options = {
        sort: {score: -1},
        limit: 10,
        projection: {_id: 0, user: 1, score: 1}
    }

    const scores = await collection.find({}, options).toArray();
    res.json(scores);
});

app.get('/api/validate-word', async (req, res) => {
    const currentWord = req.query.word;

    if(currentWord) {
        const isValid = dictionary.has(currentWord.toLocaleLowerCase());
        res.json({valid: isValid});
    } else {
        res.status(400).send('NO WORD TO VALIDATE');
    }
})

app.post('/api/submit-score', async (req, res) => {

    try {
        
        const collection = db.collection(collectionName);
        
        const {user, score} = req.body;
        if(!user || !score || score <=0 || typeof score !== 'number') {
            return res.status(400).send('INVALID DATA');
        }

        await collection.insertOne({user, score, date : new Date()});
        res.json({ message: 'Score saved!' });
    } catch (error) {
        console.error(error);
        res.status(500).send('SERVER ERROR');
    }
});

app.listen(3000, () => console.log('Server running on port:3000'));




async function connectDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        //console.log('connected..');
    } catch (error) {
        console.error('FAILED TO CONNECT TO DATABASE');
        process.exit(1);
    }
}
