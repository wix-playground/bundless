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
import {Topology, Serializable} from "./types";





function getLoaderConfig(topology: Topology, server: Server): Object & Serializable {
    const baseURL = `https://${server.address().address}:${server.address().port}${topology.baseUrl}`;
    return {
        baseURL,
        defaultJSExtensions: true,
        serialize: function () {
            return JSON.stringify(this);
        }
    }
}

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


export default function bundless(topology: Topology): Server {
    const config = spdyKeys;
    let loaderConfig: Serializable;
    const projectMap: Serializable = getProjectMap(topology.rootDir);
    return spdy.createServer(config, function (req: ServerRequest, res: ServerResponse) {
        if(req.url === '/$system') {
            loaderConfig = loaderConfig || getLoaderConfig(topology, this);
            serveSystem(res, projectMap, loaderConfig);
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