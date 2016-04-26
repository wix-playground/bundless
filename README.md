# Bundless

Experimental bundle-free JavaScript dependency server/loader.

Bundless is an experimental, HTTP/2-based alternative to browserify and 
webpack. It serves all your JavaScript dependencies to client, including
npm packages.

## Installation

`npm install bundless --save`

## Usage

Bundless behaves just like your usual Server instance:

`
    var bundless = require('bundless');
    
    var topology = {...};
    bundless(topology).listen(3000, 'localhost', function (err) {
        console.log("Bundless listening at " + this.address().address + ":" + this.address().port);
    });
`

`topology` is an optional argument, which can be a subset of the following
data structure:

`
const defaultTopology: {
    rootDir: process.cwd(),
    srcDir: 'dist',             // Your local .js files, relative to rootDir
    srcMount: '/modules',       // URL prefix of local files
    libMount: '/lib',           // URL prefix of libraries (npm dependencies)
    nodeMount: '/$node',        // Internal URL prefix of Node.js libraries
    systemMount: '/$system'     // Internal URL of the system bootstrap
};
`

You'll most likely override `srcDir` and perhaps `rootDir`. Remaining
properties give you extra control over your server topology.

This example will run server on `https://localhost:3000`.


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

TODO: Write history

## Credits

TODO: Write credits

## License

TODO: Write license