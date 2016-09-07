import {hookSystemJs} from "../../src/api";
import {ProjectMap} from "../../src/project-mapper";
import {expect} from "chai";
const SystemJS = (typeof System === 'undefined') ? require('systemjs/dist/system.src') : System;

const originalNormalizeFn = SystemJS['normalize'].bind(SystemJS);

describe('System.normalize() hook', function () {
    let projectMap: ProjectMap;

    ['https://localhost:3000/', 'https://localhost:3000/complex/path/'].forEach(baseUrl => {
        describe(`with baseUrl = ${baseUrl}`, function () {
            before(function () {
                projectMap = {
                    libMount: 'lib',
                    packages: {
                        pkgX: { p: '/lib/pkgX', m: 'x.js', r: { './funky.js': './monkey.js' } }
                    },
                    dirs: []
                };
                hookSystemJs(SystemJS, baseUrl, projectMap);
            });

            after(function () {
                SystemJS['normalize'] = originalNormalizeFn;
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
    });


});
