const fs = require('fs');
const path = require('path');

const stats = fs.statSync(path.join(__dirname, 'testproject/client/templates/index.template'));

console.log(stats.mtime.valueOf());