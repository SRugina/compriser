var express = require('express');
var app = express();
const path = require('path');

var compriser = require('../../../index');

const homepage = async (req, res) => {
    await compriser.compile(path.join(__dirname, '../client'), 'index');
    res.sendFile(path.join(__dirname, '../client/output/index.html'));
};

app.get('/', (req, res) => homepage(req, res));

app.listen(3000);