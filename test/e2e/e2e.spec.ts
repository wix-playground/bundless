import {PackageBuilder} from "../../test-kit/project-driver";
import {setupProject} from "./project-fixtures";
import {startStaticServer} from "../../test-kit/test-server";
import {Topology} from "../../src/types";
import Promise = require("bluebird");
import * as http from "http";
import {startKarmaServer} from "../../test-kit/karma-server";
import {expect} from "chai";

const host = 'localhost';
const port = 3000;

describe('Bundless', function () {
    this.timeout(30000);


    describe('loads sample project', function () {
        let project: PackageBuilder;
        let staticServer: http.Server;

        function runTest(mainModule: string, topology: Topology) {
            return Promise.resolve()
                .then(() => startStaticServer(host, port, topology))
                .then(result => staticServer = result)
                .then(() => startKarmaServer(host, port, mainModule))
                .then(passed => expect(passed).to.equal(true, 'Expected all tests to pass'));
        }


        beforeEach(function () {
            project = setupProject();
        });


        it('using simple topology', function () {
            return runTest('modules/main.js', {
                rootDir: project.getPath(),
                srcDir: 'dist',
                srcMount: '/modules',
                libMount: '/node_modules',
                nodeMount: '/$node'
            });
        });

        it('using simple topology (srcMount = "/")', function () {
            return runTest('main.js', {
                rootDir: project.getPath(),
                srcDir: 'dist',
                srcMount: '/',
                libMount: '/lib',
                nodeMount: '/$node'
            });
        });

        it('using complex mountpoints', function () {
            return runTest('foo/bar/modules/main.js', {
                rootDir: project.getPath(),
                srcDir: 'dist',
                srcMount: '/foo/bar/modules',
                libMount: '/baz/lib',
                nodeMount: '/$node'
            })
        });

        afterEach(function () {
            project.dispose();
            staticServer.close();
        });
    });
});