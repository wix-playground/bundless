# Bundless

Experimental bundle-free JavaScript dependency server/loader.

Bundless is an experimental, HTTP/2-based alternative to browserify and 
webpack. Its goal is to deliver all JavaScript dependencies to the client
without creating aggregate files ("bundles"), managing complex configurations
or migrating to alternative package managers.

## Installation

`npm install bundless --save`

## Usage

All you need to do is to create an instance of Bundless server:

```javascript
    var bundless = require('bundless');
    
    var configuration = {...};
    bundless(configuration).listen(3000, 'localhost', function (err) {
        console.log("Bundless listening at " + this.address().address + ":" + this.address().port);
    });
```

`configuration` is an optional argument, which can be a subset of the following
data structure:

```javascript
var defaultConfiguration = {
    rootDir: process.cwd(),
    srcDir: 'dist',             // Your local .js files, relative to rootDir
    srcMount: '/modules',       // URL prefix of local files
    libMount: '/lib',           // URL prefix of libraries (npm dependencies)
    nodeMount: '/$node',        // Internal URL prefix of Node.js libraries
    systemMount: '/$system'     // Internal URL of the system bootstrap,
    ssl: require('spdy-keys')   // SSL certificates
};
```

You'll most likely override `srcDir` and perhaps `rootDir`. Remaining
properties give you extra control over your server topology.

This example will run server on `https://localhost:3000`.

In your .html file/template, include the following:

```html
    <body>
        ... 
        <script src="https://localhost:3000/$system" type="text/javascript"></script>
        <script type="text/javascript">
            System.import('your/own/main/package');
        </script>

```


## Contributing

Bundless is currently in a wild, alpha, development-and-research stage.
We'll be happy for any comments, opinions, insights, thoughts, pull-requests,
suggestions and bits of wisdom from the community. 

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

<!--## History-->




<!--## Credits

TODO: Write credits-->

## License

See LICENSE.md