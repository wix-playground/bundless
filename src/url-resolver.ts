import {Topology} from "./types";
import path = require('path');
import * as nodeSupport from './node-support';

export function testMountPoint(mountPoint: string, fullUrl:string): string {
    const mountPointLength = mountPoint.length;
    if(fullUrl.slice(0, mountPointLength) === mountPoint && fullUrl.charAt(mountPointLength) === '/') {
        return fullUrl.slice(mountPointLength + 1);
    } else {
        return null;
    }
}


export function resolveUrlToFile(topology: Topology, url: string): string {
    const prefixIndex = url.indexOf('/', 1);
    const prefix = prefixIndex === -1 ? '/' : url.slice(0, prefixIndex);
    const filePath = prefixIndex === -1 ? url.slice(1) : url.slice(prefixIndex+1);
    if(prefix === topology.srcMount) {
        return path.join(topology.rootDir, topology.srcDir, filePath);
    } else if(prefix === topology.libMount) {
        return path.join(topology.rootDir, 'node_modules', filePath);
    } else if(prefix === topology.nodeMount) {
        return path.join(nodeSupport.rootDir, 'node_modules', filePath);
    } else {
        return null;
    }
}

