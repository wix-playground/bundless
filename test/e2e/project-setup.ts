import {PackageBuilder, default as projectDriver} from "../../test-kit/project-driver";
import tmp = require('tmp');
import {SynchrounousResult} from "tmp";

export function setupProject(): PackageBuilder {
    const tempDir: SynchrounousResult = tmp.dirSync();
    const project = projectDriver(tempDir.name)
        .addMainFile('dist/main.js',`
        var a = require("./a");
        var x = require("pkgX");  
        // var x2 = require("pkgX/sub");  
     `)
        .addFile('dist/a.js', '');

    const pkgX = project.addPackage('pkgX')
        .addMainFile('x.js', 'var y = require("pkgY");')
        .addFile('sub.js','')
        .addPackage('pkgY').addMainFile('y.js', '');


    return project;
}

