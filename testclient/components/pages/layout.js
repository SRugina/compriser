
const layout = (children) => {
    return (
        `<div style='position: absolute; right: 10px;'>
            ${children}
        </div>`
    );
};


module.exports = {
    layout,
};