import bundless from '../../src';
import projectDriver from '../../test-kit/project-driver';
import tmp = require('tmp');
import {SynchrounousResult} from "tmp";

const Server = require('karma').Server;

const host = '127.0.0.1';
const port = 3000;

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

    
    

function shutDown(exitCode: number) {
    project.dispose();
    process.exit(exitCode);
}

const bundlessServer = bundless({
    rootDir: project.getPath(),
    baseUrl: '/modules/',
    srcDir: 'dist'
});
bundlessServer.listen(port, host, err => {
    if(err) {
        throw err;
    } else {
        const server = new Server({
            port: 9876,
            configFile: process.cwd() + '/karma.conf.js',
            singleRun: true
        }, exitCode => shutDown(exitCode));
        server.start();
    }
});

