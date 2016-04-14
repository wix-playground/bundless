import {expect} from 'chai';
import {PackageBuilder} from "../../test-kit/project-driver";
import projectDriver from "../../test-kit/project-driver";
import tmp = require('tmp');
import {getProjectMap, ProjectMap} from "../../src/project-mapper";

describe('Project Mapper', function () {
    let tempDir;
    let project: PackageBuilder;
    let projectMap: ProjectMap;
    
    beforeEach(function () {
        tempDir = tmp.dirSync();
        project = projectDriver(tempDir.name);
        project
            .addMainFile('main.js')
            .addPackage('foo').addMainFile('bar/far/f.js');
        project
            .addPackage('bar').addMainFile('do/re/mi/fa.js')
                .addPackage('sol').addMainFile('la/si/do.js');
        projectMap = getProjectMap(project.getPath());
            
    });
    it('describes packages in project (aggressive flattening)', function () {
        expect(projectMap.packages).to.eql({
            'foo': 'node_modules/foo/bar/far/f.js',
            'bar': 'node_modules/bar/do/re/mi/fa.js',
            'sol': 'node_modules/bar/node_modules/sol/la/si/do.js'
        });
    });
});
