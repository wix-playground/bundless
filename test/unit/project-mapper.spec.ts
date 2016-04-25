import {expect} from 'chai';
import {PackageBuilder} from "../../test-kit/project-driver";
import projectDriver from "../../test-kit/project-driver";
import tmp = require('tmp');
import {getProjectMap, ProjectMap} from "../../src/project-mapper";
import {Topology} from "../../src/types";

describe('Project Mapper', function () {
    let tempDir;
    let project: PackageBuilder;
    let projectMap: ProjectMap;
    let topology: Topology;

    beforeEach(function () {
        tempDir = tmp.dirSync();
        project = projectDriver(tempDir.name);
        topology = {
            rootDir: project.getPath(),
            srcDir: 'dist',
            srcMount: '/local',
            libMount: '/lib'
        }
    });

    describe('describes packages in project', function () {
        beforeEach(function () {
            project
                .addMainFile('dist/main.js')
                .addPackage('foo').addMainFile('bar/far/f.js');
            project
                .addPackage('bar').addMainFile('do/re/mi/fa.js')
                .addPackage('sol').addMainFile('la/si/do.js');

            projectMap = getProjectMap(topology);
        });

        it('as correct project map', function () {
            expect(projectMap.packages).to.eql({
                'foo': ['/lib/foo', 'bar/far/f.js'],
                'bar': ['/lib/bar', 'do/re/mi/fa.js'],
                'sol': ['/lib/bar/node_modules/sol', 'la/si/do.js']
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

            projectMap = getProjectMap(topology);
        });

        it('with "aggressive" approach', function () {
            expect(projectMap.packages).to.eql({
                'foo': ['/lib/foo', 'index.js'],
                'bar': ['/lib/bar', 'index.js'],
                'webpack': ['/lib/bar/node_modules/webpack', 'index.js'],
                'socket.io': ['/lib/foo/node_modules/webpack/node_modules/socket.io', 'index.js']
            });
        });
    });

    describe('describes Node.js packages', function () {
        beforeEach(function () {
            project
                .addMainFile('dist/main.js');
            projectMap = getProjectMap(topology, { nodeLibs: true });
        });

        it('finds regular (ported) Node module', function () {
            expect(projectMap.packages['path']).to.eql(['/$node/path-browserify', 'index.js']);
        });

        it('finds stubbed Node module', function () {
            expect(projectMap.packages['child_process']).to.eql(['/$node', 'stub.js']);
        });

        it('finds Node module with explicit browser version', function () {
            expect(projectMap.packages['os']).to.eql(['/$node/os-browserify', 'browser.js']);
        })

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



            projectMap = getProjectMap(topology);
        });

        it('in various depths', function () {
            expect(projectMap.dirs).to.eql([
                '/local/foo/bar.js',
                '/lib/x/z.js',
                '/lib/y/node_modules/z/a/b/c.js'
            ]);
        });
    });


});
