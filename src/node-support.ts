import {PackageTuple} from "./project-mapper";
import {Readable} from "stream";
import fs = require('fs');
import path = require('path');

export const nodeLibsRootDir: string = path.dirname(require.resolve('node-libs-browser'));

export const supportedNodeLibs = [
    "assert",
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
    "child_process",
    "cluster",
    "dgram",
    "dns",
    "fs",
    "module",
    "net",
    "readline",
    "repl",
    "tls"
];


export const aliases = {
    "console": "console-browserify",
    "constants": "constants-browserify",
    "crypto": "crypto-browserify",
    "domain": "domain-browser",
    "http": "http-browserify",
    "https": "https-browserify",
    "os": "os-browserify",
    "path": "path-browserify",
    "querystring": "querystring-es3",
    "stream": "stream-browserify",
    "sys": "util",
    "timers": "timers-browserify",
    "tty": "tty-browserify",
    "util": "util",
    "vm": "vm-browserify",
    "zlib": "browserify-zlib"
};

const browserVersions = [
    "browserify-cipher",
    "browserify-aes",
    "browserify-sign",
    "browserify-aes",
    "create-ecdh",
    "create-hash",
    "create-hmac",
    "diffie-hellman",
    "pbkdf2",
    "public-encrypt",
    "browserify-aes",
    "randombytes",
    "os-browserify",
    "process",
    "util-deprecate"
];

export const stubUrl: PackageTuple = ['/$node', 'stub.js'];

export function serveStub(): Readable {
    const stream = new Readable();
    stream._read = () => {};
    stream.push('module.exports = null;');
    stream.push(null);
    return stream;
}

export function resolveNodeUrl(url: string): string {
    return path.join(nodeLibsRootDir, 'node_modules', url.slice(7));
}

function endsWith(str: string, subStr: string): boolean {
    return str.slice(-subStr.length) === subStr;
}

export function resolveNodePkg(pkgPath: string): PackageTuple {
    if (endsWith(pkgPath, '/inherits')) {
        return [pkgPath, 'inherits_browser.js'];
    } else if (browserVersions.some(pkgName => endsWith(pkgPath, pkgName))) {
        return [pkgPath, 'browser.js'];
    } else {
        return null;
    }
}
