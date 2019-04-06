let title = 'hello!';

const layout = require('../layout').layout;

const content = () => {
    return (
        `${layout(
            `<p>this is very interesting content!</p>
            <div style='position: relative; background-color: red; width: 300px; height: 300px;'>
                hello there!
            </div>`
        )}`
    );
};

module.exports = {
    title,
    content
};