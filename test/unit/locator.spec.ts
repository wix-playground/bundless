import {expect} from 'chai';
import {ProjectMap} from "../../src/project-mapper";
import * as locator from '../../src/locator';
import {joinUrl} from "../../src/locator";
import {extractPackageNames} from "../../src/locator";
describe('locate', function () {
    let projectMap: ProjectMap;
    let preProcess: { (name: string, parentName?: string, parentAddress?: string): string };
    let postProcess: { (resolvedName: string): string };

    const baseUrl = 'https://localhost:3000/';
    const libMount = 'lib';

    before(function () {
        projectMap = {
            packages: {
                pkgX: ['/lib/pkgX', 'x.js'],
                pkgY: ['/lib/pkgX/node_modules/pkgY', 'y.js'],
                zlib: ['/$node/browserify-zlib', 'src/index.js']
            },
            dirs: [
                '/a/b.js',
                '/lib/pkgX/foo/bar.js'
            ]
        };
        preProcess = locator.preProcess.bind(null, projectMap);
        postProcess = locator.postProcess.bind(null, projectMap, baseUrl);
    });

    describe('preProcess()', function () {
        it('appends automagically .js extension', function () {
            expect(preProcess('./a')).to.equal('./a.js');
            expect(preProcess('pkgX/data.json')).to.equal('/lib/pkgX/data.json')
            expect(preProcess('src/client/editor/editor.skin.html')).to.equal('src/client/editor/editor.skin.html.js')
        });

        it('finds package main file', function () {
            expect(preProcess('pkgX')).to.equal('/lib/pkgX/x.js');
        });

        it('finds sub module in a package', function () {
            expect(preProcess('pkgX/sub')).to.equal('/lib/pkgX/sub.js')
        });

        it('deals with relative paths', function () {
            expect(preProcess('./elliptic')).to.equal('./elliptic.js');
            expect(preProcess('../elliptic')).to.equal('../elliptic.js');
            expect(preProcess('../../elliptic')).to.equal('../../elliptic.js');
            expect(preProcess('..')).to.equal('..');
        });


        it('finds node package', function () {
            expect(preProcess('zlib')).to.equal('/$node/browserify-zlib/src/index.js');
        });
    });

    describe('postProcess()', function () {
        it('identifies default index file in a directory', function () {
            expect(postProcess(`${baseUrl}a/b.js`)).to.equal(`${baseUrl}a/b/index.js`);
            expect(postProcess(`${baseUrl}a/c.js`)).to.equal(`${baseUrl}a/c.js`);
            expect(postProcess(`${baseUrl}lib/pkgX/foo/bar.js`)).to.equal(`${baseUrl}lib/pkgX/foo/bar/index.js`);
        });

        it('resolves result of Systen.normalize() as package', function () {
            expect(postProcess(`${baseUrl}lib/pkgX/node_modules/pkgY`)).to.equal(`${baseUrl}lib/pkgX/node_modules/pkgY/y.js`);
            expect(postProcess(`${baseUrl}lib/pkgX/node_modules/pkgY/`)).to.equal(`${baseUrl}lib/pkgX/node_modules/pkgY/y.js`);
        });
    });

    describe('joinUrl()', function () {
        it('correctly joins base Url and paths', function () {
            const expectedResult = 'https://localhost:3000/a/b.js';
            expect(joinUrl('https://localhost:3000', 'a', 'b.js')).to.equal(expectedResult);
            expect(joinUrl('https://localhost:3000/', '/a', 'b.js')).to.equal(expectedResult);
            expect(joinUrl('https://localhost:3000', '/a/', '/b.js')).to.equal(expectedResult);
        });
    });

    describe('extractPackageNames()', function () {
        it('Extracts package names :)', function () {
            expect(extractPackageNames(baseUrl, libMount, `${baseUrl}lib/pkgX/node_modules/pkgY/y.js`))
                .to.eql(['pkgX', 'pkgY']);
        });

        it('Ignores non-lib path', function () {
            expect(extractPackageNames(baseUrl, libMount, `${baseUrl}a/b/c/d.js`))
                .to.eql([]);
        });
    });


    

});

