import {hookSystemJs} from "../../src/api";
import {ProjectMap} from "../../src/project-mapper";
import {expect} from "chai";
const SystemJS = (typeof System === 'undefined') ? require('systemjs/dist/system.src') : System;

describe('System.normalize() hook', function () {
    let projectMap: ProjectMap;
    let baseUrl: string;

    before(function () {
        projectMap = {
            libMount: 'lib',
            packages: {
                pkgX: { p: '/lib/pkgX', m: 'x.js', r: { './funky.js': './monkey.js' } }
            },
            dirs: []
        };
        baseUrl = 'https://localhost:3000/';
        hookSystemJs(SystemJS, baseUrl, projectMap);
    });

    it('resolves correctly package url', function () {
        return SystemJS.normalize('pkgX', `${baseUrl}index.js`)
            .then(result => expect(result).to.eql(`${baseUrl}lib/pkgX/x.js`));
    });

    it('resolves correctly remapped url 1', function () {
        return SystemJS.normalize('./funky', `${baseUrl}lib/pkgX/x.js`)
            .then(result => expect(result).to.eql(`${baseUrl}lib/pkgX/monkey.js`));
    });
});
