const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
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


// app.get('/',  async (req, res) => {  
    
//     res.send( await readFile('./index.html', 'utf-8'));
// });

connectDB();

app.get('/dictionary', async (req, res) => {
    res.sendFile(path.resolve(__dirname,  'words_dictionary.json'));
});

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

app.post('/api/submit-score', async (req, res) => {
    console.log('TESTTESTTEST');
    try {
        // await client.connect();
        // const db = client.db(dbName);
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
        console.log('connected..');
    } catch (error) {
        console.error('FAILED TO CONNECT TO DATABASE');
        process.exit(1);
    }
}