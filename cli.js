#!/usr/bin/env node

const index = require('./index');
const isset = require('./utils/isset').isset;

const [,, ...args] = process.argv; //get an array of the arguments given

const location = process.cwd(); //get folder location of where the command was executed

//index.setDirectory(location)
if (args[0] == 'compile') {
    if ( ((args.includes('-u')) || (args.includes('--update'))) && (isset(() => args[1])) ) {
        console.log("testing123");
        index.compile(location, args[1], true);
        console.log('test');
    } else if (isset(() => args[1])) {
        index.compile(location, args[1]);
    }
}

if (args[0] == 'init') {
    index.init(location);
}
