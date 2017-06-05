# Bundless

Experimental bundle-free JavaScript dependency loader.

Bundless is an experimental dependency loader inspired by JSPM, browserify
and webpack, while trying to solve some of their inherent problems. Its 
goal is to deliver all JavaScript dependencies to the client without 
creating aggregate files ("bundles"), while sticking to npm as the 
package manager and to its project structure.

## Installation

`npm install bundless --save`

## Usage

At its core, bundless generates a script and set of hooks which make your
local project accessible to the SystemJS loader without any additional
configuration.

For an easy start, use the sample ExpressJS router included in the project:

```javascript
const bundless = require('bundless/sample-server');
const express = require('express');
const path = require('path');

const app = express();
const topology = {};
app.use(bundless.express(topology));
app.get('/', (req, res) => res.sendFile(path.resolve(process.cwd(), 'index.html')));

app.listen(8080, function (err) {
    err ? console.error(err) : console.log(`Listening at ${this.address().address}:${this.address().port}`);
});
```

Your `/index.html` file should then contain:
 
```html
<body>
    <script src="/lib/systemjs/dist/system.js"></script>
    <script src="/$bundless"></script>
    <script>
        $bundless(System);
        System.import('/modules/main');
    </script>
</body>
```


(Note that you must have SystemJS installed.)

Your entry point, in this example, should be then `src/main.js`.
 
You can modify your application structure by setting properties of the 
`topology` variable:

```javascript

const topology = {
    rootDir: process.cwd(),
    srcDir: 'src',             // Your local .js files, relative to rootDir
    srcMount: '/modules',       // URL prefix of local files
    libMount: '/lib',           // URL prefix of libraries (npm dependencies)
    nodeMount: '/$node',        // Internal URL prefix of Node.js libraries
};
```

For more details, check the /sample-server/express.ts file.

Note, that bundless should work with any static web server, provided
it has been configured according to the topology.

## How it works

Bundless is a set of hooks which lets the browser to resolve and load
dependencies (via SystemJS) in almost exactly the same way as NodeJS does, 
with some neat tricks inspired mostly by browserify.

This, of course, means that for larger projects, we're going to load quite
a bunch of files. This, of course, raises some performance issues, comparing
to "bundled" solutions. So far, we see HTTP/2 serving as a solution,
while researching other possibilities.

## Contributing

Bundless is currently in a wild, alpha, development-and-research stage.
We'll be happy for any comments, opinions, insights, thoughts, pull-requests,
suggestions and bits of wisdom from the community. 

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## License

See LICENSE.md

