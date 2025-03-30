const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const querystring = require('querystring');
const Parser = require('@postlight/parser');
const { Configuration, OpenAIApi } = require('openai');
// Add a new package for managing background tasks
const { v4: uuidv4 } = require('uuid');
// Create a new Map to store the results of completed tasks
const taskResults = new Map();

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));


const configuration = new Configuration({
    organization: process.env.OPENAI_ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = "Analyze the news article provided below and generate a consistent semantic and sentiment analysis for an end-user of a news aggregator app. Your analysis should include:\n1. Objectivity and neutrality score (0-10 scale): Provide a score for the objectivity and neutrality of the article, where 0 is the least objective/neutral and 10 is the most objective/neutral. Concisely list the reasons that led to this score, using specific examples from the article.\n2. Ideological/political bias detection: List up to 5 tags/labels (max. 5 words each) describing the nature and extent of the bias, indicating the direction of the bias. Provide a concise explanation of the factors contributing to each bias label, using specific examples from the article.\nConsider the following aspects for your analysis:\na. Balance of perspectives\nb. Language and tone\nc. Focus on facts versus opinions\nd. Selective presentation of information\ne. Use of reliable and verifiable sources\n\nAfter your analysis, generate a concise, objective, neutral, and unbiased summary of the article in just a few sentences. \n\nPlease also provide a brief overall assessment of the article, considering both its strengths and weaknesses, and suggest potential ways to improve its objectivity, neutrality, or balance, if necessary.\n\nAnalyze the following news article, keeping in mind its publication date, the author's history, and the outlet's reputation:"


app.post('/api/search', async (req, res) => {
    try {
        const query = querystring.escape(req.body.query);
        const response = await axios.get(
            `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${process.env.NEWS_API_KEY}`
        );
        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while searching news API.' });
    }
});

app.get('/api/parse', async (req, res) => {
    try {
        const url = req.query.url;
        const response = await Parser.parse(url, { contentType: 'text' });
        res.json(response?.content?.trim());
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while parsing the data.' });
    }
});


app.post('/api/start-analysis', async (req, res) => {
    const taskId = uuidv4();
    const articleContent = req.body.content;

    // Start the analysis in the background and store the result
    analyzeArticle(taskId, articleContent).then((result) => {
        taskResults.set(taskId, result);
    });

    // Send the taskId to the client
    res.json({ taskId });
});

app.get('/api/check-analysis/:taskId', (req, res) => {
    const taskId = req.params.taskId;

    if (taskResults.has(taskId)) {
        res.json({ status: 'completed', result: taskResults.get(taskId) });
        taskResults.delete(taskId);
    } else {
        res.json({ status: 'pending' });
    }
});


const analyzeArticle = async (taskId, content) => {
    try {
        const openai = new OpenAIApi(configuration);
        const response = await openai.createChatCompletion({
            model: 'gpt-4o-mini-2024-07-18',
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: content }
            ],
            max_tokens: 1000,
            n: 1,
            stop: null,
            temperature: 0.7,
        });
        return response.data;
    } catch (err) {
        console.error(`An error occurred while analyzing the data for task ${taskId}: ${err}`);
        return { error: `An error occurred while analyzing the data: ${err}` };
    }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
