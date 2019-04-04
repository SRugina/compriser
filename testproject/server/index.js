var express = require('express');
var app = express();
const path = require('path');

var templater = require('../../index');

async function homepage(req, res) {
    await templater.compile(path.join(__dirname, '../client'), 'index');
    res.sendFile(path.join(__dirname, '../client/output/index.html'));
}

app.get('/', (req, res) => homepage(req, res));

app.listen(3000);