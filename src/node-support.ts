import {PackageTuple} from "./project-mapper";
import {Readable} from "stream";
const nodeLibsBrowser = require('node-libs-browser');
import fs = require('fs');
import path = require('path');

const rootDir: string = path.join(path.dirname(require.resolve('node-libs-browser')), 'node_modules');


export const supportedNodeLibs = [
    // "assert",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "dgram",
    "dns",
    "domain",
    "events",
    "fs",
    "http",
    "https",
    "module",
    "net",
    "os",
    "path",
    "process",
    "punycode",
    "querystring",
    "readline",
    "repl",
    "stream",
    "string_decoder",
    "sys",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "vm",
    "zlib"
];

export const stubs = [
    "assert",
    "child_process",
    "cluster",
    "crypto",
    "dgram",
    "dns",
    "fs",
    "module",
    "net",
    "os",
    // "process",
    "readline",
    "repl",
    "tls",
    "utils",
    "vm",
    "zlib"
];


export const aliases = {
    "console": "console-browserify",
    "constants": "constants-browserify",
    // "crypto": "crypto-browserify",
    "domain": "domain-browser",
    "http": "http-browserify",
    "https": "https-browserify",
    // "os": "os-browserify/browser.js",
    "path": "path-browserify",
    // "process": "process/browser.js",
    "querystring": "querystring-es3",
    "stream": "stream-browserify",
    "sys": "util",
    "timers": "timers-browserify",
    "tty": "tty-browserify",
    // "util": "util",
    // "vm": "vm-browserify",
    // "zlib": "browserify-zlib"
};

export const stubUrl = ['/$node', 'stub.js'];

export function serveStub(): Readable {
    const stream = new Readable();
    stream._read = () => {};
    stream.push('module.exports = null;')
    stream.push(null);
    return stream;
}

export function resolveNodeUrl(url: string): string {
    return path.join(rootDir, url.slice(7));
}

export function resolveNodePkg(pkgPath: string): PackageTuple {
    if(pkgPath.endsWith('/inherits')) {
        return [pkgPath, 'inherits_browser.js'];
    } else if(pkgPath === 'process') {
        return [pkgPath, 'browser.js']
    } else {
        return null;
    }
}
