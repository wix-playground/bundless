import {expect} from 'chai';
import {PackageBuilder} from "../../test-kit/project-driver";
import projectDriver from "../../test-kit/project-driver";
import tmp = require('tmp');
import {getProjectMap, ProjectMap} from "../../src/project-mapper";
import {BootstrapScriptOptions} from "../../src/types";
import {generateProjectInfo} from "../../src/defaults";

describe('Project Mapper', function () {
    let tempDir;
    let project: PackageBuilder;
    let projectMap: ProjectMap;
    let topology: BootstrapScriptOptions;

    beforeEach(function () {
        tempDir = tmp.dirSync();
        project = projectDriver(tempDir.name);
        topology = {
            rootDir: project.getPath(),
            srcDir: 'dist',
            srcMount: '/local',
            libMount: '/lib',
            nodeMount: '/$node',
            mapper: {
                nodeLibs: false
            }
        }
    });

    describe('describes packages in project', function () {
        beforeEach(function () {
            project
                .addMainFile('dist/main.js')
                .addPackage('foo').addMainFile('bar/far/f.js');
            project
                .addPackage('la')
                    .addMainFile('index.js')
                    .addBrowserMainFile('browser.js');
            project
                .addPackage('sol').addJspmMainFile('la/si/do.js');

            project
                .addPackage('do')
                    .addToPackageJson({
                        browser: {
                            './bus.js': './sub.js'
                        }
                    });

            projectMap = getProjectMap(generateProjectInfo(topology));
        });

        it('as correct project map', function () {
            expect(projectMap.libMount).to.eql('lib');
            expect(projectMap.packages).to.eql({
                'foo': { p: '/lib/foo', m: 'bar/far/f.js' },
                'la':  { p: '/lib/la',  m: 'browser.js' },
                'sol': { p: '/lib/sol', m: 'la/si/do.js' },
                'do':  { p: '/lib/do', m: 'index.js', r: { './bus.js': './sub.js' } }
            });
        });
    });

    describe('resolves different versions', function () {
        beforeEach(function () {
            project
                .addMainFile('dist/main.js')
                .addPackage('foo')
                    .addPackage('webpack', '1.2.3')
                        .addPackage('socket.io', '7.8.9');


            project
                .addPackage('bar')
                    .addPackage('webpack', '2.3.4')
                        .addPackage('socket.io', '4.5.6');

            projectMap = getProjectMap(generateProjectInfo(topology));
        });

        it('with "aggressive" approach', function () {
            expect(projectMap.packages).to.eql({
                'foo': { p: '/lib/foo', m: 'index.js' },
                'bar': { p: '/lib/bar', m: 'index.js' },
                'webpack': { p: '/lib/bar/node_modules/webpack', m: 'index.js' },
                'socket.io': { p: '/lib/foo/node_modules/webpack/node_modules/socket.io', m: 'index.js'}
            });
        });
    });

    describe('among multiple instances of the same version', function () {
        beforeEach(function () {
            project
                .addPackage('webpack', '1.2.3');

            project
                .addPackage('foo')
                    .addPackage('webpack', '1.2.3');
            
            projectMap = getProjectMap(generateProjectInfo(topology));
        });

        it('preferes package closer to the top level', function () {
            expect(projectMap.packages).to.eql({
                'foo': { p: '/lib/foo', m: 'index.js' },
                'webpack': { p: '/lib/webpack', m: 'index.js' }
            });
        });
    });

    describe('describes Node.js packages', function () {
        const npm2nodeLibsDir = '/$node/node-libs-browser/node_modules';
        const npm3nodeLibsDir = '/$node';
        beforeEach(function () {
            project
                .addMainFile('dist/main.js');
            topology.mapper.nodeLibs = true;
            projectMap = getProjectMap(generateProjectInfo(topology));
        });

        it('finds regular (ported) Node module', function () {
            expect(projectMap.packages['path'].p).to.be.oneOf([
                `${npm2nodeLibsDir}/path-browserify`,
                `${npm3nodeLibsDir}/path-browserify`
            ]);
            expect(projectMap.packages['path'].m).to.equal('index.js');
        });

        it('finds stubbed Node module', function () {
            expect(projectMap.packages['child_process']).to.eql({ p: '/$node', m: 'node-support/stub.js' });
        });

        it('finds Node module with explicit browser version', function () {
            expect(projectMap.packages['os'].p).to.be.oneOf([
                `${npm2nodeLibsDir}/os-browserify`,
                `${npm3nodeLibsDir}/os-browserify`,
            ]);
            expect(projectMap.packages['os'].m).to.equal('browser.js');
        });
    });

    describe('describes default index files', function () {
        beforeEach(function () {
            project
                .addFile('dist/foo/bar/index.js')
                .addPackage('x').addFile('z/index.js')
                .addPackage('poo').addFile('index.js', '// this should be invisible');
            project
                .addPackage('y')
                    .addFile('a.index')
                    .addPackage('z')
                        .addFile('a/b/c/index.js');
            projectMap = getProjectMap(generateProjectInfo(topology));
        });

        it('in various depths', function () {
            expect(projectMap.dirs).to.eql([
                '/local/foo/bar.js',
                '/lib/x/z.js',
                '/lib/y/node_modules/z/a/b/c.js'
            ]);
        });
    });

    describe('in topology where srcDir contains the whole project', function () {
        beforeEach(function () {
            topology.srcDir = '';

            project
                .addFile('dist/foo/bar/index.js')
                .addPackage('x').addFile('z/index.js')
                .addPackage('poo').addFile('index.js', '// this should be invisible');
            project
                .addPackage('y')
                .addFile('a.index')
                .addPackage('z')
                .addFile('a/b/c/index.js');
            projectMap = getProjectMap(generateProjectInfo(topology));
        });

        it('index files are collected correctly', function () {
            expect(projectMap.dirs).to.eql([
                '/local/dist/foo/bar.js',
                '/lib/x/z.js',
                '/lib/y/node_modules/z/a/b/c.js'
            ]);
        });
    });


});
