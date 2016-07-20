import {resolveUrlToFile} from "../../src/url-resolver";
import {expect} from 'chai';
import {Topology} from "../../src/types";
import path = require('path');

describe('url resolver', function () {
    describe('with default topology', function () {
        let topology: Topology;
        let resolve;
        before(function () {
            topology = {
                rootDir: '/root',
                srcDir: 'dist',
                srcMount: '/',
                libMount: '/node_modules',
                nodeMount: '/$node'
            };
            resolve = resolveUrlToFile.bind(null, topology);
        });

        it('resolves source file', function () {
            expect(resolve('/a.js')).to.equal(path.normalize('/root/dist/a.js'));
        });

        it('resolves package file', function () {
            expect(resolve('/node_modules/pkgX/foo/bar/a.js')).to.equal(path.normalize('/root/node_modules/pkgX/foo/bar/a.js'));
        });
    });

    describe('with custom topology', function () {
        let topology: Topology;
        let resolve;
        before(function () {
            topology = {
                rootDir: '/root',
                srcDir: 'dist',
                srcMount: '/local',
                libMount: '/lib',
                nodeMount: '/$node'
            };
            resolve = resolveUrlToFile.bind(null, topology);
        });

        it('resolves source file', function () {
            expect(resolve('/local/a.js')).to.equal(path.normalize('/root/dist/a.js'));
        });

        it('resolves package file', function () {
            expect(resolve('/lib/pkgX/foo/bar/a.js')).to.equal(path.normalize('/root/node_modules/pkgX/foo/bar/a.js'));
        });
    });

});
