import bundless from '../src';
import projectDriver from '../test-kit/project-driver';
import tmp = require('tmp');

const Server = require('karma').Server;

const host = '127.0.0.1';
const port = 3000;

const tempDir = tmp.dirSync().name;

const project = projectDriver(tempDir)
    .addMainFile('main.js', '');

const bundlessServer = bundless(project.getPath());
bundlessServer.listen(port, host, err => {
    if(err) {
        throw err;
    } else {
        const server = new Server({
            port: 9876,
            configFile: process.cwd() + '/karma.conf.js',
            singleRun: true
        }, exitCode => {
            process.exit(exitCode);
        });
        server.start();
    }
});

