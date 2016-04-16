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

function serveFile(res: ServerResponse, filePath: string) {
    setTimeout(() => {
        res.writeHead(200, {
            'Content-type': 'application/javascript'
        });
        fs.createReadStream(filePath).pipe(res);
    }, 200);

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
    const projectMap: Serializable = getProjectMap(topology);
    log('project map', projectMap);
    return spdy.createServer(config, function (req: ServerRequest, res: ServerResponse) {
        log('HIT', req.url);
        if(req.url === '/$system') {
            loaderConfig = loaderConfig || getLoaderConfig(this);
            serveSystem(res, projectMap, loaderConfig);
        } else {
            if(req.url === '/node_modules/pkgX/x.js') debugger;
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