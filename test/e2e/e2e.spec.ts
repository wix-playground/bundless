import {PackageBuilder} from "../../test-kit/project-driver";
import {setupProject} from "./project-fixtures";
import {startStaticServer} from "../../test-kit/test-server";
import {Topology} from "../../src/types";
import Promise = require("bluebird");
import * as http from "http";
import {runKarma} from "../../test-kit/karma-server";

const host = 'localhost';
const port = 3000;

function runTest(mainModule: string, topology: Topology) {
    return Promise.resolve()
        .then(() => startStaticServer(host, port, topology))
        .then((staticServer: http.Server) => {
            return runKarma(host, port, mainModule)
                .then(() => new Promise((resolve) => {
                    staticServer.close(() => resolve(staticServer))
                }));
        });
}

describe('Bundless', function () {
    this.timeout(30000);
    describe('loads sample project', function () {
        let project: PackageBuilder;

        beforeEach(function () {
            project = setupProject();
        });


        it('using simple topology', function () {
            return runTest('modules/main.js', {
                rootDir: project.getPath(),
                srcDir: 'dist',
                srcMount: '/modules',
                libMount: '/node_modules',
                nodeMount: '/$node',
                systemMount: '/$system'
            });
        });

        it('using simple topology (srcMount = "/")', function () {
            return runTest('main.js', {
                rootDir: project.getPath(),
                srcDir: 'dist',
                srcMount: '/',
                libMount: '/lib',
                nodeMount: '/$node',
                systemMount: '/$system'
            });
        });

        afterEach(function () {
            project.dispose();
        });
    });
});