import {PackageTuple} from "./../project-mapper";
import fs = require('fs');
import path = require('path');

export const rootDir: string = path.dirname(require.resolve('node-libs-browser'));

export const supportedLibs = [
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

    "_stream_transform" : ['readable-stream', 'transform.js'],
    "inherits": ['util/node_modules/inherits', 'inherits_browser.js'],

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

export const stubPath = 'node-stub.js';
export const globals = 'global.js';

export function resolveNodeUrl(urlPath: string): string {
    if(urlPath === stubPath) {
        return path.resolve(__dirname, './node-stub.js');
    } else if(urlPath === globals) {
        return path.resolve(__dirname, './node-globals.js');
    } else {
        return path.join(rootDir, 'node_modules', urlPath);
    }
}

