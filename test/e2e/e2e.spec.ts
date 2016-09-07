import {PackageBuilder} from "../../test-kit/project-driver";
import {setupProject} from "./project-fixtures";
import {startStaticServer} from "../../test-kit/test-server";
import {Topology} from "../../src/types";
import Promise = require("bluebird");
import * as http from "http";
import {startKarmaServer} from "../../test-kit/karma-server";
import {expect} from "chai";
import {defTopology} from "../../src/defaults";

const host = 'localhost';
const port = 3000;

describe('Bundless', function () {
    this.timeout(30000);


    ['/', '/complex/path/'].forEach((basePath) => {
        describe(`loads sample project with base '${basePath}'`, function () {

            let staticServer: http.Server;

            function runTest(topology: Topology) {
                const mainModule = topology.srcMount === '/' ? 'main.js' : `${topology.srcMount.slice(1)}/main.js`;
                const project: PackageBuilder = setupProject(topology.srcDir);
                topology.rootDir = project.getPath();
                return Promise.resolve()
                    .then(() => startStaticServer(host, port, basePath, topology))
                    .then(result => staticServer = result)
                    .then(() => startKarmaServer(host, port, basePath, mainModule))
                    .then(passed => expect(passed).to.equal(true, 'Expected all tests to pass'))
                    .then(() => project.dispose());
            }


            it('using default topology', function () {
                return runTest(defTopology);
            });

            it('using simple topology', function () {
                return runTest({
                    srcDir: 'dist',
                    srcMount: '/modules',
                    libMount: '/node_modules',
                    nodeMount: '/$node'
                });
            });

            it('using simple topology (srcMount = "/")', function () {
                return runTest({
                    srcDir: 'dist',
                    srcMount: '/',
                    libMount: '/lib',
                    nodeMount: '/$node'
                });
            });

            it('using complex mountpoints', function () {
                return runTest({
                    srcDir: 'dist',
                    srcMount: '/foo/bar/modules',
                    libMount: '/baz/lib',
                    nodeMount: '/$node'
                })
            });

            it('serving sources from the root', function () {
                return runTest({
                    srcDir: '.',
                    srcMount: '/foo/bar/modules',
                    libMount: '/baz/lib',
                    nodeMount: '/$node'
                })
            });

            afterEach(function () {
                staticServer.close();
            });
        });
    })


});