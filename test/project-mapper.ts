import {getProjectMap, ProjectMap} from '../src/project-mapper';
import projectDriver from '../test-kit/project-driver';
import tmp = require('tmp');
import {PackageBuilder} from "../test-kit/project-driver";
import {expect} from 'chai';

describe('Project mapper', function () {
    let project: PackageBuilder;
    let projectMap: ProjectMap;
    const baseUrl: string = 'https://localhost:4000/modules';

    before(() => {
        project = projectDriver(tmp.dirSync())
            .addMainFile('foo/bar/monkey-man.js');
        projectMap = getProjectMap(project.getPath(), )
    });
    
    it('detects correctly basic topology', function () {
        expect(projectMap.serialize())
    })
});
