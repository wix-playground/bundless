import {PackageTuple} from "./project-mapper";
import {Readable} from "stream";
const nodeLibsBrowser = require('node-libs-browser');
import fs = require('fs');

export const supportedNodeLibs = [
    // "assert",
    // "buffer",
    "child_process",
    "cluster",
    // "console",
    // "constants",
    // "crypto",
    "dgram",
    "dns",
    // "domain",
    "events",
    "fs",
    // "http",
    // "https",
    "module",
    "net",
    "os",
    "path",
    "process",
    "punycode",
    // "querystring",
    "readline",
    "repl",
    // "stream",
    // "string_decoder",
    // "sys",
    // "timers",
    "tls",
    "tty",
    // "url",
    // "util",
    // "vm"
    /*"zlib"*/
];

export function resolveNodeLib(nodeLibName: string): { url: string, location: PackageTuple } {
    if(supportedNodeLibs.indexOf(nodeLibName) > -1) {
        const pkgDir = '/$node/' + nodeLibName;
        const mainFilePath = '';
        return { 
            url: nodeLibName,
            location: [pkgDir, mainFilePath]
        };
    } else {
        throw new Error(`${nodeLibName} is not a supported Node.js library.`);
    }
}

export function serveSupportedNodeLib(nodeLibName: string): Readable {
    const nodeLibPath = nodeLibsBrowser[nodeLibName];
    if(nodeLibPath) {
        return fs.createReadStream(nodeLibPath)
    } else {
        const stream = new Readable();
        stream._read = () => {};
        stream.push('module.exports = null;')
        stream.push(null);
        return stream;
    }

}