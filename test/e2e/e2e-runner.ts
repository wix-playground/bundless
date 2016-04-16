import bundless from '../../src';
import {PackageBuilder} from "../../test-kit/project-driver";
import {setupProject} from "./project-setup";

const Server = require('karma').Server;

const host = '127.0.0.1';
const port = 3000;

const project: PackageBuilder = setupProject();

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

