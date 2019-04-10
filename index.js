const isset = require('./utils/isset').isset;

const path = require('path');
const fs = require('fs');

var dirpath = '';
var state = {};


/**
 * recursively list all files in a directory. not exposed to end-user, only used internally
 *
 * ```javascript
 * walk(path.join(__dirname, 'client'), callbackFunction());
 * ```
 *
 * @async
 * @param {path} dir  the path to the folder that contains the 'templates' and 'components' folders
 * @param {Function} done  the function that the list of files is given to and any errors. (err, res)
 */
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

/**
 * update/create the state.json file. not exposed to end-user, only used internally
 *
 * ```javascript
 * //returns nothing
 * const compriser = require('compriser');
 * compriser.init(path.join(__dirname, 'client'));
 * ```
 *
 * @async
 * @param {path} location  the path to the folder that contains the 'templates' and 'components' folders
 */
const init = (location) => {
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
                var varlist = data.match(/\${.+?}/g);
                varlist = Array.from(new Set(varlist));
                if (varlist != null) {
                    for (var x = 0; x < varlist.length; x++) {
                        varlist[x] = varlist[x].slice(2, varlist[x].length - 1);
                        if (varlist[x].includes("(")) { //ie if a function
                            varlist[x] = varlist[x].split(/\(|\)/);
                            varlist[x].splice(varlist[x].length - 1, 1); // 0 is func name, 1 is arguments
                            console.log(varlist[x]);
                        }
                    }
                }
                let stats = fs.statSync(path.join(dirpath, templateList[i]));
                state[templateNames[i]] = { 'path': templateList[i], 'variables': varlist, 'last-edit': stats.mtime.valueOf() };
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
                    let stats = fs.statSync(path.join(dirpath, componentList[i]));
                    state[componentNames[i]]['component'] = { 'path': componentList[i], 'last-edit': stats.mtime.valueOf() };
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
            console.log("updating");
            resolve();
        });
    });
};

/**
 * compile a '.template' file into html, combining components into it.
 *
 * ```javascript
 * //returns nothing
 * const compriser = require('compriser');
 * compriser.compile(path.join(__dirname, 'client'), 'index', true);
 * ```
 *
 * @async
 * @param {path} location the path to the folder that contains the 'templates' and 'components' folders
 * @param {string} pageName the name of the '.template' file that you want to compile
 * @param {Boolean=} [toUpdate] optional: whether to check for new components/templates before compiling. Recommended for development mode
 */
const compile = async (location, pageName, toUpdate) => {
    return new Promise(async resolve => {
        try {
            dirpath = location;
            if (toUpdate == true) {
                await init(location);
            }
            if (!(fs.existsSync(path.join(dirpath, '/config/state.json')))) {
                await init(location);
            }

            state = require(path.join(dirpath, '/config/state.json'));
            let stats = fs.statSync(path.join(dirpath, state[pageName]['path']));
            if (stats.mtime.valueOf() != state[pageName]['last-edit']) {
                await init(location);
            }
            if (isset(() => state[pageName]['component'])) {
                let stats = fs.statSync(path.join(dirpath, state[pageName]['component']['path']));
                if (stats.mtime.valueOf() != state[pageName]['component']['last-edit']) {
                    await init(location);
                }
                var page = require(path.join(dirpath, state[pageName]['component']['path']));
                var templateData = fs.readFileSync(path.join(dirpath, state[pageName]['path']), 'utf8');
                if (state[pageName]['variables'] != null) {
                    for (var i = 0; i < state[pageName]['variables'].length; i++) {
                        let variableMid;
                        if (Array.isArray(state[pageName]['variables'][i])) { //ie is a function
                            variableMid = '${' + state[pageName]['variables'][i][0] + '\\(' + state[pageName]['variables'][i][1] + '\\)' + '}';
                        } else {
                            variableMid = '${' + state[pageName]['variables'][i] + '}';
                        }
                        var toReplace = '\\' + variableMid;
                        var expression = new RegExp(toReplace, 'g');
                        //console.log(expression);
                        let result;
                        if (Array.isArray(state[pageName]['variables'][i])) { //ie is a function
                            result = templateData.replace(expression, page[state[pageName]['variables'][i][0]]);
                        } else {
                            result = templateData.replace(expression, page[state[pageName]['variables'][i]]);
                        }
                        //console.log(page[state[pageName]['variables'][i]]);
                        templateData = result;
                        //console.log(result);
                    }
                    if (!fs.existsSync(path.join(dirpath, '/output/'))) {
                        fs.mkdirSync(path.join(dirpath, '/output/'));
                    }
                    fs.writeFileSync(path.join(dirpath, '/output/' + pageName + '.html'), templateData, 'utf8');
                } else {
                    if (!fs.existsSync(path.join(dirpath, '/output/'))) {
                        fs.mkdirSync(path.join(dirpath, '/output/'));
                    }
                    fs.writeFileSync(path.join(dirpath, '/output/' + pageName + '.html'), templateData, 'utf8');
                }
            } else {
                templateData = fs.readFileSync(path.join(dirpath, state[pageName]['path']), 'utf8');
                if (!fs.existsSync(path.join(dirpath, '/output/'))) {
                    fs.mkdirSync(path.join(dirpath, '/output/'));
                }
                fs.writeFileSync(path.join(dirpath, '/output/' + pageName + '.html'), templateData, 'utf8');
            }
        } catch (error) {
            if (error['errno'] == -2) { // one of the files in state.json no longer exists
                await init(location);
                compile(location, pageName);
            } else {
                console.log(error);
            }
        }
        resolve();
    });
};


module.exports = {
    init,
    compile
};