import {PackageBuilder} from "../../test-kit/project-driver";
import {setupProject} from "./project-fixtures";
import * as karma from 'karma';
import {createTestServer} from "../../test-kit/test-server";
import {Topology} from "../../src/types";
import Promise = require("bluebird");
import * as http from "http";


function runTest(topology: Topology) {
    return new Promise((resolve, reject) => {
        createTestServer(topology).listen(3001, function (err) {
            const staticServer: http.Server = this;
            const karmaServer = new karma.Server({
                port: 9876,
                configFile: process.cwd() + '/karma.conf.js',
                singleRun: true
            }, (a,b,c) => {
                staticServer.close(resolve);
            });
            if(err) {
                reject(err);
            } else {
                karmaServer.start();
            }
        });
    });
}

describe('Bundless', function () {
    this.timeout(30000);
    describe('loads sample project', function () {
        const project: PackageBuilder = setupProject();

        it('using simple topology', function () {
            return runTest({
                rootDir: project.getPath() + 'prd',
                    srcDir: 'dist',
                srcMount: '/',
                libMount: '/node_modules',
                nodeMount: '/$node',
                systemMount: '/$system'
            });
        });

        afterEach(function () {
            project.dispose();
        });
    });
});