import {expect} from 'chai';
import {ProjectMap} from "../../src/project-mapper";
import {getModuleLocator} from '../../src/locator';
describe('locate', function () {
    let projectMap: ProjectMap;
    let locate;

    before(function () {
        projectMap = {
            packages: {
                pkgX: ['node_modules/pkgX', 'x.js'],
                pkgY: ['node_modules/pkgX/node_modules/pkgY', 'y.js']
            },
            serialize: null
        };
        locate = getModuleLocator(projectMap, (moduleName) => moduleName);
    });

    it('appends automagically .js extension', function () {
        expect(locate('./a')).to.equal('./a.js');
        expect(locate('pkgX/data.json')).to.equal('node_modules/pkgX/data.json')
    });

    it('finds package main file', function () {
        expect(locate('pkgX')).to.equal('node_modules/pkgX/x.js');
    });

    it('finds sub module in a package', function () {
        expect(locate('pkgX/sub')).to.equal('node_modules/pkgX/sub.js')
    });
});
