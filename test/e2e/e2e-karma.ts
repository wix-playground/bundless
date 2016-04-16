import {PackageBuilder} from "../../test-kit/project-driver";
import {setupProject} from "./project-setup";
import {setupBundlessServer} from "./server-setup";

const Server = require('karma').Server;


const project: PackageBuilder = setupProject();

function shutDown(exitCode: number) {
    project.dispose();
    process.exit(exitCode);
}

setupBundlessServer(project, () => {
    const server = new Server({
        port: 9876,
        configFile: process.cwd() + '/karma.conf.js',
        singleRun: true
    }, exitCode => shutDown(exitCode));
    server.start();
});

