let title = 'hello!';

const layout = require('../layout').layout;

function content() {
    return (
        `${layout(
            `<p>this is very interesting content!</p>
            <div style='position: relative; background-color: red; width: 300px; height: 300px;'></div>`
        )}`
    );
}

module.exports = {
    title,
    content
};