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

        it('with aggressive version flattening', function () {
            expect(projectMap.packages).to.eql({
                'foo': ['/lib/foo', 'bar/far/f.js'],
                'bar': ['/lib/bar', 'do/re/mi/fa.js'],
                'sol': ['/lib/bar/node_modules/sol', 'la/si/do.js']
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
