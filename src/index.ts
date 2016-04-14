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
import {getProjectMap, ProjectMap} from './project-mapper';


interface RouteHandler {
    (res: ServerResponse, projectMap: ProjectMap): void;
}

const predefinedRoutes: { [url: string]: RouteHandler } = {
    '/$system': serveSystem
};


function serveFile(res: ServerResponse, filePath: string) {
    res.writeHead(200, {
        'Content-type': 'application/javascript'
    });
    fs.createReadStream(filePath).pipe(res);
}

function send404(res: ServerResponse) {
    res.writeHead(404);
    res.end('');
}

function resolveUrlToFile(topology: Topology, url: string): string {
    const filePath: string = url.slice(topology.baseUrl.length);
    return path.resolve(topology.rootDir, topology.srcDir, filePath);
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

function serveSystem(res: ServerResponse, projectMap: ProjectMap) {
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
        streamSystemModule('./loader-bootstrap')
    ], res);
}

export interface Topology {
    rootDir: string;
    baseUrl: string;
    srcDir: string;
}

export default function bundless(topology: Topology): Server {
    const config = spdyKeys;
    let projectMap;
    return spdy.createServer(config, function (req: ServerRequest, res: ServerResponse) {
        projectMap = projectMap ||  getProjectMap(topology.rootDir, `https://${this.address().address}:${this.address().port}${topology.baseUrl}`);
        if(req.url in predefinedRoutes) {
            predefinedRoutes[req.url](res, projectMap);
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
        baseUrl: '/modules/',
        srcDir: 'dist'
    };
    bundless(topology).listen(3000, function () {
        console.log(`${this.address().address}:${this.address().port}`);
    });
}