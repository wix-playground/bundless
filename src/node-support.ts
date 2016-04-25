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

export type AliasValue = string | PackageTuple;
export type AliasDict = { [alias: string]: AliasValue }
export const aliases: AliasDict = {
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
    "zlib": "browserify-zlib",

    "_stream_transform" : ['/$node/readable-stream', 'transform.js'],
    "inherits": ['/$node/util/node_modules/inherits', 'inherits_browser.js'],

    // stubs:
    "child_process": null,
    "cluster": null,
    "dgram": null,
    "dns": null,
    "fs": null,
    "module": null,
    "net": null,
    "readline": null,
    "repl": null,
    "tls": null
};

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

