import {expect} from 'chai';
import {ProjectMap} from "../../src/project-mapper";
import * as locator from '../../src/locator';
describe('locate', function () {
    let projectMap: ProjectMap;
    let preProcess: { (name: string, parentName?: string, parentAddress?: string): string };
    let postProcess: { (resolvedName: string): string };

    before(function () {
        projectMap = {
            packages: {
                pkgX: ['node_modules/pkgX', 'x.js'],
                pkgY: ['node_modules/pkgX/node_modules/pkgY', 'y.js']
            },
            dirs: [
                'a/b/index.js',
                'node_modules/pkgX/foo/bar/index.js'
            ],
            serialize: null
        };
        preProcess = locator.preProcess.bind(null, projectMap);
        postProcess = locator.postProcess.bind(null, projectMap);
    });

    it('appends automagically .js extension', function () {
        expect(preProcess('./a')).to.equal('./a.js');
        expect(preProcess('pkgX/data.json')).to.equal('node_modules/pkgX/data.json')
    });

    it('finds package main file', function () {
        expect(preProcess('pkgX')).to.equal('node_modules/pkgX/x.js');
    });

    it('finds sub module in a package', function () {
        expect(preProcess('pkgX/sub')).to.equal('node_modules/pkgX/sub.js')
    });
    
    it('identifies default index file in a directory', function () {
        expect(postProcess('/a/b.js')).to.equal('/a/b/index.js');
        expect(postProcess('/a/c.js')).to.equal('/a/c.js');
        expect(postProcess('/node_modules/pkgX/foo/bar.js')).to.equal('/node_modules/pkgX/foo/bar/index.js');
    });
});
