import {fetch} from '../../src/client/system-hooks';
import {expect} from "chai";
import {NewProjectMap, Topology} from "../../src/types";



describe.only('fetch() hook remaps urls', function () {
    const base = 'http://localhost:3000';
    const projectMap: NewProjectMap = {
        'pkgX': 'lib/pkgX/main'
    };
    const topology: Topology = {
        libMount: '/lib'
    };

    function testFetch(url: string): string {
        let result;
        const origFetch = (load) => result = load;
        fetch(origFetch, projectMap, topology)({ address: url });
        return result.address;
    }


    it('for local module', function () {
        expect(testFetch(`${base}/pkgX`)).to.equal(`${base}/lib/pkgX/main.js`);
    });
});
