const isset = require('./utils/isset').isset;

const path = require('path');
const fs = require('fs');

var dirpath = '';
var state = {};

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

function init(location) {
    return new Promise(resolve => {
        dirpath = location;
        walk(dirpath, function (err, allfiles) {
            var templateList = allfiles.filter(function (file) {
                return path.extname(file).toLowerCase() === '.template';
            });

            for (var i = 0; i < templateList.length; i++) {
                var templateNames = [];
                templateNames[i] = templateList[i].split('/');
                templateNames[i] = templateNames[i][templateNames[i].length - 1];
                templateNames[i] = templateNames[i].split('.');
                templateNames[i] = templateNames[i][0];

                var data = fs.readFileSync(path.join(dirpath, templateList[i]), 'utf8');
                var varlist = data.match(/\${\b\S+?\b}/g);
                varlist = Array.from(new Set(varlist));
                console.log(varlist);
                if (varlist != null) {
                    for (var x = 0; x < varlist.length; x++) {
                        varlist[x] = varlist[x].slice(2, varlist[x].length - 1);
                    }
                }

                state[templateNames[i]] = { 'path': templateList[i], 'variables': varlist };
            }
            var componentList = allfiles.filter(function (file) {
                var isComponent = false;
                var fileFolders = file.split('/');
                if (fileFolders[1].toLowerCase() == 'components') {
                    isComponent = true;
                } else {
                    isComponent = false;
                }
                return ((path.extname(file).toLowerCase() === '.js') && (isComponent));
            });
            for (i = 0; i < componentList.length; i++) {
                var componentNames = [];
                componentNames[i] = componentList[i].split('/');
                componentNames[i] = componentNames[i][componentNames[i].length - 1];
                componentNames[i] = componentNames[i].split('.');
                componentNames[i] = componentNames[i][0];
                if (isset(() => state[componentNames[i]])) {
                    state[componentNames[i]]['component'] = componentList[i];
                } else {
                    if (!isset(() => state['addon-components'])) {
                        state['addon-components'] = {};
                        state['addon-components'][componentNames[i]] = {};
                    }
                    state['addon-components'][componentNames[i]] = { 'path': componentList[i] };
                }
            }
            if (!fs.existsSync(path.join(dirpath, '/config/state.json'))) {
                //console.log(path.join(dirpath, '/config/'));
                fs.mkdirSync(path.join(dirpath, '/config/'));
            }
            fs.writeFileSync(path.join(dirpath, '/config/state.json'), JSON.stringify(state, null, 4));
            resolve();
        });
    });
}

async function compile(location, pageName) {
    return new Promise(async resolve => {
        try {
            await init(location);
            state = require(path.join(dirpath, '/config/state.json'));
            if (isset(() => state[pageName]['component'])) {
                var page = require(path.join(dirpath, state[pageName]['component']));
                var templateData = fs.readFileSync(path.join(dirpath, state[pageName]['path']), 'utf8');
                if (state[pageName]['variables'] != null) {
                    for (var i = 0; i < state[pageName]['variables'].length; i++) {
                        var variablemid = '${' + state[pageName]['variables'][i] + '}';
                        var toReplace = '\\' + variablemid;
                        var expression = new RegExp(toReplace, 'g');
                        console.log(expression);
                        var result = templateData.replace(expression, page[state[pageName]['variables'][i]]);
                        console.log(page[state[pageName]['variables'][i]]);
                        templateData = result;
                        console.log(result);
                    }
                    if (!fs.existsSync(path.join(dirpath, '/output/'))) {
                        fs.mkdirSync(path.join(dirpath, '/output/'));
                    }
                    fs.writeFileSync(path.join(dirpath, '/output/' + pageName + '.html'), templateData, 'utf8');
                } else {
                    if (!fs.existsSync(path.join(dirpath, '/output/'))) {
                        fs.mkdirSync(path.join(dirpath, '/output/'));
                    }
                    fs.writeFileSync(path.join(dirpath,'/output/' + pageName + '.html'), templateData, 'utf8');
                }
            } else {
                templateData = fs.readFileSync(path.join(dirpath, state[pageName]['path']), 'utf8');
                if (!fs.existsSync(path.join(dirpath, '/output/'))) {
                    fs.mkdirSync(path.join(dirpath, '/output/'));
                }
                fs.writeFileSync(path.join(dirpath,'/output/' + pageName + '.html'), templateData, 'utf8');
            }
        } catch (error) {
            console.log(error);
        }
        resolve();
    });
}


module.exports = {
    init,
    compile
};