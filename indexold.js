const fs = require('fs');
const path = require('path');

const EXTENSION = '.template';
var templateFiles = [];
var templateVariables = [];
var componentFiles = [];
var dirpath = '';
var temppath = '';

var walk = function (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    file = file.replace(dirpath, '');
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};


function setDirectory(location) {
    dirpath = location
}

function init() {
    setDirectory(__dirname);
}

function compile() {
    temppath = path.join(dirpath, '/templates')
    console.log(temppath)
    walk(temppath, parseTemplates)
}
function parseTemplates(err, allfiles) {
    list = allfiles.filter(function (file) {
        return path.extname(file).toLowerCase() === EXTENSION;
    });
    console.log(list);
    templateFiles = list;
    for (i = 0; i < list.length; i++) {
        data = fs.readFileSync(path.join(dirpath, list[i]), 'utf8');
        var varlist = data.match(/\${\b\S+?\b}/g);
        templateVariables.push(varlist);
    }
    console.log(templateVariables);
    walk(temppath, parseComponents)
}

function parseComponents(err, allfiles) {
    list = allfiles.filter(function (file) {
        return path.extname(file).toLowerCase() === 'js';
    });
    console.log(list);
    templateFiles = list;
    for (i = 0; i < list.length; i++) {
        data = fs.readFileSync(path.join(dirpath, list[i]), 'utf8');
        var varlist = data.match(/\${\b\S+?\b}/g);
        templateVariables.push(varlist);
    }
    console.log(templateVariables);
}

function replaceAll() {
    for (i = 0; i < templateFiles.length; i++) {
        var data = fs.readFileSync(path.join(dirpath, templateFiles[i]), 'utf8');
        for (x = 0; x < templateVariables[i].length; x++) {
            variablemid = '${' + templateVariables[i][x] + '}';
            toReplace = '\\' + variablemid;
            expression = new RegExp(toReplace, 'g');
            var result = data.replace(expression, variable);

            fs.writeFileSync('cached-result/homepage.html', result, 'utf8')

        }
    }
}

module.exports = {
    setDirectory,
    compile
};