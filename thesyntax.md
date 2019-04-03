
.template files:
    .template files are the html without variables etc. inserted

    ${varname} is for variables/function outputs that need to be inserted (implemented for variables) (todo for functions)

    $${varname} is for global variables (that apply across files) (todo)

    put !!! on left and ride side of a variable and function to have it not be replaced by it's value (todo)

server-rendering-side:
    js file named same as .template containing function named same as template file.
    this 'main' function then calls the global parser function

server-side:
    any language to call the cli (or if nodejs backend, use the npm package)