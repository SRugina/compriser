var express = require('express');
var app = express();
const path = require('path');
const util = require('util');

var exec = util.promisify(require('child_process').exec);

//TODO: for JS backend, use require() instead of cmd method
function homepage(req, res) {
    function puts(error, stdout, stderr) {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        res.sendFile(path.join(__dirname, '../client/output/index.html'));
        console.log("hi");
    }
    exec("cd client && templater compile index", puts);
}

app.get('/', (req, res) => homepage(req, res));

app.listen(3000);