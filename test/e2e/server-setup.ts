import bundless from '../../src/sample-server';
import {PackageBuilder} from "../../test-kit/project-driver";
const host = '127.0.0.1';
const port = 3000;


export function setupBundlessServer(project: PackageBuilder, cb: Function) {
    const bundlessServer = bundless({
        rootDir: project.getPath(),
        srcDir: 'dist',
        srcMount: '/modules',
        libMount: '/lib',
        nodeMount: '/$node',
        systemMount: '/$system'
    });
    bundlessServer.listen(port, host, err => {
        if(err) {
            throw err;
        } else {
            cb();
        }
    });
}
