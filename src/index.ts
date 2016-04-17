import {Server} from "http";
const spdy = require('spdy');
const spdyKeys = require('spdy-keys');
import fs = require('fs');
import path = require('path');
import {ServerRequest} from "http";
import {ServerResponse} from "http";
import stream = require('stream');
import {Readable} from "stream";
import {Writable} from "stream";
import {getProjectMap} from './project-mapper';
import {Topology, Serializable} from "./types";
import {log} from "./logger";
import {resolveUrlToFile} from "./url-resolver";
import { serveStub, resolveNodeUrl} from "./node-support";

function getLoaderConfig(server: Server): Object & Serializable {
    const baseURL = `https://${server.address().address}:${server.address().port}`;
    return {
        baseURL,
        defaultJSExtensions: false,
        serialize: function () {
            return JSON.stringify(this);
        }
    }
}

const contentTypes = {
    '.json': 'application/json'
};

function serveFile(res: ServerResponse, filePath: string) {
    const contentType = contentTypes[path.extname(filePath)] || 'application/javascript';
    res.writeHead(200, {
        'Content-type': contentType
    });
    fs.createReadStream(filePath).pipe(res);
}

function serveNodeLib(url: string, res: ServerResponse) {
    if(url === '/$node/stub.js' || url === '/$node/browser.js') {
        serveStub().pipe(res);
    } else {
        serveFile(res, resolveNodeUrl(url));
    }
}

function send404(res: ServerResponse) {
    res.writeHead(404);
    res.end('');
}


function streamSystemModule(moduleId): Readable {
    return fs.createReadStream(require.resolve(moduleId));
}

function seqStreams(inputStreams: Array<Readable | string>, outputStream: Writable): void {
    const input: Readable | string = inputStreams[0];
    if(input) {
        if(typeof input === 'string') {
            outputStream.write(input);
            seqStreams(inputStreams.slice(1), outputStream);
        } else {
            input.on('end', function () {
                seqStreams(inputStreams.slice(1), outputStream);
            });
            input.pipe(outputStream, { end: false });
        }
    } else {
        outputStream.end();
    }
}

function serveSystem(res: ServerResponse, projectMap: Serializable, loaderConfig: Serializable) {
    res.writeHead(200, {
        'Content-type': 'application/javascript'
    });
    seqStreams([
        streamSystemModule('systemjs/dist/system.js'),
        'var projectMap = ',
        projectMap.serialize(),
        ';\n\n',
        'var locator = {};\n\n',
        '(function (exports){',
        streamSystemModule('./locator'),
        '\n\n})(locator);\n\n',
        'System.config(', loaderConfig.serialize(), ')\n\n',
        streamSystemModule('./loader-bootstrap')
    ], res);
}


/* TODO: normalize topology (leading/trailing slashes) */
export default function bundless(topology: Topology): Server {
    const config = spdyKeys;
    let loaderConfig: Serializable;
    const projectMap: Serializable = getProjectMap(topology, { nodeLibs: true });
    log('project map', projectMap);
    return spdy.createServer(config, function (req: ServerRequest, res: ServerResponse) {
        log('HIT', req.url);
        if(req.url === '/$node/constants-browserify/constants.json') debugger;
        if(req.url === '/$system') {
            loaderConfig = loaderConfig || getLoaderConfig(this);
            serveSystem(res, projectMap, loaderConfig);
        } else if(req.url.slice(0,7) === '/$node/') {
            serveNodeLib(req.url, res);
        } else {
            const filePath: string = resolveUrlToFile(topology, req.url);
            try {
                serveFile(res, filePath);
            } catch (err) {
                send404(res);
            }
        }
    });
}

if(require.main === module) {
    const topology = {
        rootDir: process.cwd(),
        srcDir: 'dist',
        srcMount: '/',
        libMount: '/node_modules'
    };
    bundless(topology).listen(3000, function () {
        console.log(`Bundless listening at ${this.address().address}:${this.address().port}`);
    });
}