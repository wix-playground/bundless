import {expect} from 'chai';
import {ProjectMap} from "../../src/project-mapper";
import * as locator from '../../src/client/locator';
import {parseUrl, ParsedUrl, applyFileRemapping, joinUrl} from "../../src/client/locator";

describe('locate', function () {
    let projectMap: ProjectMap;
    let preProcess: { (name: string, parentName?: string, parentAddress?: string): string };
    let postProcess: { (resolvedName: string): string };

    const baseUrl = 'https://localhost:3000/';
    const libMount = 'lib';

    before(function () {
        projectMap = {
            libMount,
            packages: {},
            dirs: []
        };
        preProcess = locator.preProcess.bind(null, projectMap, baseUrl);
        postProcess = locator.postProcess.bind(null, projectMap, baseUrl);
    });

    describe('preProcess()', function () {
        
        before(function () {
            projectMap.packages = {
                pkgX: { p: '/lib/pkgX', m: 'x.js' },
                pkgY: { p: '/lib/pkgX/node_modules/pkgY', m: 'y.js'},
                zlib: { p: '/$node/browserify-zlib', m: 'src/index.js' }
            };
        });

        it('appends automagically .js extension', function () {
            expect(preProcess('./a')).to.equal('./a.js');
            expect(preProcess('pkgX/data.json')).to.equal(`${baseUrl}lib/pkgX/data.json`);
            expect(preProcess('src/client/editor/editor.skin.html')).to.equal('src/client/editor/editor.skin.html.js');
        });

        it('reduces superfluous slashes', function () {
            expect(preProcess('..//a')).to.equal('../a.js');
            expect(preProcess('http://host:8080/foo//bar')).to.equal('http://host:8080/foo/bar.js');
        });

        it('finds package main file', function () {
            expect(preProcess('pkgX')).to.equal(`${baseUrl}lib/pkgX/x.js`);
        });

        it('finds sub module in a package', function () {
            expect(preProcess('pkgX/sub')).to.equal(`${baseUrl}lib/pkgX/sub.js`)
        });

        it('deals with relative paths', function () {
            expect(preProcess('./elliptic')).to.equal('./elliptic.js');
            expect(preProcess('../elliptic')).to.equal('../elliptic.js');
            expect(preProcess('../../elliptic')).to.equal('../../elliptic.js');
            expect(preProcess('..')).to.equal('..');
            expect(preProcess('../.')).to.equal('../.');
        });


        it('finds node package', function () {
            expect(preProcess('zlib')).to.equal(`${baseUrl}$node/browserify-zlib/src/index.js`);
        });
    });

    describe('postProcess()', function () {

        before(function () {
            projectMap.packages = {
                pkgX: { p: '/lib/pkgX', m: 'x.js', r: { './funky.js': './monkey.js' } },
                pkgY: { p: '/lib/pkgX/node_modules/pkgY', m: 'y.js'},
            };
            projectMap.dirs = [
                '/a/b.js',
                '/lib/pkgX/foo/bar.js'
            ];
        });
        
        it('applies file remapping', function () {
            expect(postProcess(`${baseUrl}lib/pkgX/funky.js`)).to.equal(`${baseUrl}lib/pkgX/monkey.js`)
        });

        it('identifies default index file in a directory', function () {
            expect(postProcess(`${baseUrl}a/b.js`)).to.equal(`${baseUrl}a/b/index.js`);
            expect(postProcess(`${baseUrl}a/b/`)).to.equal(`${baseUrl}a/b/index.js`);
            expect(postProcess(`${baseUrl}a/c.js`)).to.equal(`${baseUrl}a/c.js`);
            expect(postProcess(`${baseUrl}lib/pkgX/foo/bar.js`)).to.equal(`${baseUrl}lib/pkgX/foo/bar/index.js`);
            expect(postProcess(`${baseUrl}lib/pkgX/foo/bar/`)).to.equal(`${baseUrl}lib/pkgX/foo/bar/index.js`);
        });

        it('resolves result of System.normalize() as package', function () {
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
            expect(joinUrl('https://localhost:3000', 'a', './b.js')).to.equal(expectedResult);
        });

    });

    describe('parseUrl()', function () {
        it('parses url (1)', function () {
            expect(parseUrl(`${baseUrl}${libMount}/pkgX/foo/bar/x.js`, baseUrl, libMount)).to.eql({
                pkg: 'pkgX',
                pkgPath: 'lib/pkgX',
                localPath: 'foo/bar/x.js',
                ext: '.js'
            });
        });
        it('parses url (2)', function () {
            expect(parseUrl(`${baseUrl}${libMount}/pkgX`, baseUrl, libMount)).to.eql({
                pkg: 'pkgX',
                pkgPath: 'lib/pkgX',
                localPath: '',
                ext: ''
            });
        });
        it('parses url (3)', function () {
            expect(parseUrl(`${baseUrl}${libMount}/pkgX/`, baseUrl, libMount)).to.eql({
                pkg: 'pkgX',
                pkgPath: 'lib/pkgX',
                localPath: '',
                ext: ''
            });
        });
        it('parses url (4)', function () {
            expect(parseUrl(`${baseUrl}${libMount}/pkgX/node_modules/pkgY/y.js`, baseUrl, libMount)).to.eql({
                pkg: 'pkgY',
                pkgPath: 'lib/pkgX/node_modules/pkgY',
                localPath: 'y.js',
                ext: '.js'
            });
        });
        it('Ignores non-lib path', function () {
            expect(parseUrl(`${baseUrl}a/b/c/d.js`, baseUrl, libMount)).to.eql({
                pkg: '',
                pkgPath: '',
                localPath: 'a/b/c/d.js',
                ext: '.js'
            });
        });

        it('Deals with complex libMount', function () {
            expect(parseUrl(`${baseUrl}a/b/c/d.js`, baseUrl, 'a/b')).to.eql({
                pkg: 'c',
                pkgPath: 'a/b/c',
                localPath: 'd.js',
                ext: '.js'
            });
        });
    });
    
    describe('applyFileRemapping()', function () {
        it('applies file remapping', function () {
            const projectMap: ProjectMap = {
                libMount,
                packages: {
                    pkgX: { p: '/lib/pkgX', m: 'x.js', r: { './funky.js': './monkey.js' } }
                },
                dirs: []
            };
            const url: ParsedUrl = {
                pkg: 'pkgX',
                pkgPath: 'pkgX',
                localPath: 'funky.js',
                ext: '.js'
            };
            expect(applyFileRemapping(projectMap, url)).to.eql('pkgX/monkey.js');    
        });

        it('detects correctly the main file (1)', function () {
            const projectMap: ProjectMap = {
                libMount,
                packages: {
                    pkgX: { p: '/lib/pkgX', m: 'x.js', r: { './funky.js': './monkey.js' } }
                },
                dirs: []
            };
            const url: ParsedUrl = {
                pkg: 'pkgX',
                pkgPath: 'pkgX',
                localPath: '',
                ext: '.js'
            };
            expect(applyFileRemapping(projectMap, url)).to.eql('pkgX/x.js');
        });

        it('detects correctly the main file (dot in front of the main file path)', function () {
            const projectMap: ProjectMap = {
                libMount,
                packages: {
                    pkgX: { p: '/lib/pkgX', m: './x.js', r: { './funky.js': './monkey.js' } }
                },
                dirs: []
            };
            const url: ParsedUrl = {
                pkg: 'pkgX',
                pkgPath: 'pkgX',
                localPath: '',
                ext: '.js'
            };
            expect(applyFileRemapping(projectMap, url)).to.eql('pkgX/x.js');
        });

        it('detects correctly the main file (main file path a result of remapping)', function () {
            const projectMap: ProjectMap = {
                libMount,
                packages: {
                    pkgX: { p: '/lib/pkgX', m: './main.js', r: { './main.js': './x.js' } }
                },
                dirs: []
            };
            const url: ParsedUrl = {
                pkg: 'pkgX',
                pkgPath: 'pkgX',
                localPath: '',
                ext: '.js'
            };
            expect(applyFileRemapping(projectMap, url)).to.eql('pkgX/x.js');
        });
        
    });
    
});

