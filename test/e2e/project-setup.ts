import {PackageBuilder, default as projectDriver} from "../../test-kit/project-driver";
import tmp = require('tmp');
import {SynchrounousResult} from "tmp";
import {supportedLibs} from "../../src/node-support";


export function setupProject(): PackageBuilder {
    const tempDir: SynchrounousResult = tmp.dirSync();
    const project = projectDriver(tempDir.name)
        .addMainFile('dist/main.js',`
        // var a = require("./a");
        var x = require("pkgX");  
        var x2 = require("pkgX/sub");  
     `)
        // .addFile('dist/a.js', supportedLibs.map(libName => `var ${libName} = require("${libName}");`).join('\n'));

    const pkgX = project.addPackage('pkgX')
        .addMainFile('x.js', `
            var y = require("pkgY");
            var data = require("./data.json");
            var bar = require("./foo/bar");
            var qux = require("./foo/bar/baz/qux");
         `)
        .addFile('sub.js','')
        .addFile('data.json', '{ "wtf": "data" }')
        .addFile('foo/bar/index.js')
        .addFile('foo/bar/baz/qux.js', 'var bar = require("..");')
        .addPackage('pkgY').addMainFile('y.js', '');


    return project;
}

