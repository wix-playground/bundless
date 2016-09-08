import projectDriver from '../../test-kit/project-driver';
import tmp = require('tmp');
import {SynchrounousResult} from "tmp";
import {expect, use} from "chai";
import {PackageBuilder} from "../../test-kit/project-driver";
import {hookSystemJs} from '../../src/api';
import {getProjectMap} from "../../src/project-mapper";
import {generateProjectInfo, defTopology} from "../../src/defaults";
import _ = require('lodash');

const SystemJS = (typeof System === 'undefined') ? require('systemjs/dist/system.src') : System;
const SysConstructor = <any>SystemJS.constructor;

use(require('chai-as-promised'));

// These test cases taken from:
// https://github.com/substack/node-browserify/tree/master/test/browser_field_resolve

describe('file remapping', function () {
    const baseUrl = 'https://localhost:3000/';
    const libMount = 'lib';
    const entryPoint = `${baseUrl}${libMount}/a/index.js`;

    let project: PackageBuilder;
    let tempDir;

    const setup = () => {
        const system = new SysConstructor();
        const topology = _.assign({}, defTopology, { rootDir: tempDir.name });
        const projectMap = getProjectMap(generateProjectInfo(topology));
        hookSystemJs(system, baseUrl, projectMap);
        return (moduleId: string) => system.normalize(moduleId, entryPoint);
    };

    beforeEach(function () {
        tempDir = tmp.dirSync();
        project = projectDriver(tempDir.name).addPackage('a');
    });

    afterEach(function () {
        project.dispose();
    });

    it('a', function () {
        project
            .addToPackageJson({
                browser: {
                    'zzz': 'aaa'
                }
            })
            .addPackage('aaa')
                .addMainFile('main.js');
        const normalize = setup();
        return normalize('zzz').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/node_modules/aaa/main.js`));
    });

    it('b', function () {
        project
            .addToPackageJson({
                browser: {
                    "zzz": "./x"
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return normalize('zzz').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/x.js`));
    });

    it('c', function () {
        project
            .addToPackageJson({
                browser: {
                    "./z": "./x"
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return normalize('./z.js').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/x.js`));
    });

    it('d', function () {
        project
            .addToPackageJson({
                browser: {
                    "./z.js": "./x.js"
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return normalize('./z.js').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/x.js`));
    });

    it('e', function () {
        project
            .addToPackageJson({
                browser: {
                    "./z": "./x.js"
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return normalize('./z.js').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/x.js`));
    });

    it('f', function () {
        const baseUrl = 'https://localhost:3000/';
        project
            .addToPackageJson({
                browser: {
                    "aaa/what": "./x.js"
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return normalize('aaa/what.js').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/x.js`));
    });

    it('g', function () {
        project
            .addToPackageJson({
                browser: {
                    "./x.js": false
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return expect(normalize('./x')).to.be.rejected;
    });

    it('h', function () {
        project
            .addToPackageJson({
                browser: {
                    "./x.js": false
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return expect(normalize('./x.js')).to.be.rejected;
    });

    it('i', function () {
        project
            .addToPackageJson({
                browser: {
                    "./x": "./browser"
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return normalize('./x.js').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/browser.js`));
    });

    it('j', function () {
        project
            .addToPackageJson({
                browser: {
                    "./x.js": "./browser.js"
                }
            })
            .addFile('x.js')
            .addPackage('aaa')
            .addMainFile('main.js');
        const normalize = setup();
        return normalize('./x').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/browser.js`));
    });

    it('k', function () {
        project
            .addPackage('x')
                .addFile('hey.js')
                .addToPackageJson({
                    browser: {
                        "./zzz": "./hey"
                    }
                });

        const normalize = setup();
        return normalize('x/zzz').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/node_modules/x/hey.js`));
    });

    it('l', function () {
        project
            .addPackage('x')
            .addFile('hey.js')
            .addToPackageJson({
                browser: {
                    "./zzz.js": "./hey"
                }
            });

        const normalize = setup();
        return normalize('x/zzz').then(result => expect(result).to.equal(`${baseUrl}${libMount}/a/node_modules/x/hey.js`));
    });
});
