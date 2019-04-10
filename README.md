# Templater

Templater is a simplistic, fast templating system that allows a component based workflow - all server-side.

## Usage:

The folder used for front-end code must have a `components` folder and a `templates` folder.

### How does it Work?:

![how templater works](./templater-howitworks.jpg)

### Template Files:

These are the html files without the variables/functions/components inserted. file ending: `.template`

#### Syntax:

`${varname}` is for variable/function output or components that need to be inserted. For functions you do `${funcname()}` or `${funcname}`. Passing arguments into functions from template files is not supported, as logic should be stored in the component files, not the template files. If an argument(s) is passed into the function, that argument(s) will simply be ignored.

#### Example: index.template

```html
<!DOCTYPE html>
<html>
    <head>
        <title>${title}</title>
    </head>
    <body>
        ${content()}
    </body>
</html>
```

### Component Files:

These files are where you define the variables/functions that get inserted into template files. file ending: `.js`

Each template file can have a 'master' component that is named the same as the template file. In this, all the variables the template uses are defined.

If a template file does not have a 'master' component, it will be outputed as-is but as a .html file when compiled.

If a component is not named the same as a template file, it is an 'add-on' component. It can be used in other components e.g. a general layout component.

#### Syntax:

##### Generic syntax:

variables are defined as usual.

functions that are used in template files **must** return something, as this is what gets inserted into the file. To make code more readable, we recommend that return statements use brackets, like so: `return ('hello!');`

when returning multi-line code, use the backtick "\`" instead of double/single quotes and **make sure the first backtick is on the same line as your first line of code, and the last backtick is on the same line as your last line of code, like so:**

```js
return (
    `<p>this is very interesting content!</p>
        <div style='position: relative; background-color: red; width: 300px; height: 300px;'>
            hello there!
        </div>`
    );
```

**NOT THIS:**

```js
return (`
        <p>this is very interesting content!</p>
        <div style='position: relative; background-color: red; width: 300px; height: 300px;'>
            hello there!
        </div>
        `);
```

as this will add unnecessary new lines and tabs/spaces to the resultant html file.

##### 'add-on' component Syntax:

Here is an example to showcase using 'add-on' components:

layout.js
```js
const layout = (children) => {
    return (
        `<div style='position: absolute; right: 10px;'>
            ${children}
        </div>`
    );
};


module.exports = {
    layout
};
```
index.js
```js
let title = 'hello!';

const layout = require('./layout').layout;

const content = () => {
    return (
        `${layout(
            `<p>this is very interesting content!</p>
            <div style='position: relative; background-color: red; width: 300px; height: 300px;'>
                hello there!
            </div>`
        )}`
    );
}

module.exports = {
    title,
    content
};
```

### Backend Usage:

#### Non-NodeJS backend:

Use the CLI to execute the compile function, for instance when the page is requested (if the file needs to be up to date all the time).

The command to execute is `templater compile TEMPLATER_FILE_NAME -u` e.g. `templater compile index -u`. The directory this is executed in is where it will search for the templates and components folder, so make sure to `cd` to the right directory before executing the command.

The `-u`/`--update` flag is for if you've added new components or templates since the last compile. For production, you should remove this flag for extra performance.

Note: you cannot compile 'add-on' components.

Go Example:

```go
package main

import (
	"log"
	"net/http"
	"os/exec"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		out, err := exec.Command("/bin/bash", "-c", "cd client && templater compile index -u").Output();
		if err != nil {
			log.Fatal(err)
		}
		log.Printf(string(out))
        http.ServeFile(w, r, "client/output/index.html")
    })
	if err := http.ListenAndServe(":3000", nil); err != nil {
		panic(err)
	}
}
```

Rust Execute Command:

```rust
...
use std::process::Command;
use std::io::{self, Write};
let output = if cfg!(target_os = "windows") {
    Command::new("cmd")
            .args(&["/C", "cd client && templater compile index"])
            .output()
            .expect("failed to execute process")
} else {
    Command::new("sh")
            .arg("-c")
            .arg("cd client && templater compile index")
            .output()
            .expect("failed to execute process")
};
io::stdout().write_all(&output.stdout).unwrap();
io::stderr().write_all(&output.stderr).unwrap();

...
```

PHP Execute Command:

```php
...
shell_exec('cd client && templater compile index');
...
```

#### NodeJS backend:

Use `require('templater')` to import templater. Then, to compile a single page, do `template.compile(path, page)` where path is the absolute path to the folder that contains the `templates` and `components` folders, and page is a string of the name of the template name that should be compiled.

If you've added new components or templates since the last compile, send `true` as a third parameter to the compile function, like so: `template.compile(path, page, true)`. **This is the recommended way to use the compile function when in the development phase**

Note: you cannot compile 'add-on' components.

ExpressJS Example:

```js
const express = require('express');
const app = express();
const path = require('path');

const templater = require('templater');

async function homepage(req, res) {
    await templater.compile(path.join(__dirname, '../client'), 'index', true); //this will execute first, making sure the output index.html file exists so no errors occur on the first request.
    res.sendFile(path.join(__dirname, '../client/output/index.html'));
}

app.get('/', (req, res) => homepage(req, res));

app.listen(3000);
```