import {Server} from "http";
const spdy = require('spdy');
const spdyKeys = require('spdy-keys');
import fs = require('fs');
import path = require('path');
import {ServerRequest} from "http";
import {ServerResponse} from "http";
import stream = require('stream');
import {Readable} from "stream";
import {getProjectMap, makeSerializable} from './project-mapper';
import {Topology, Serializable} from "./types";
import {log} from "./logger";
import {resolveUrlToFile, testMountPoint} from "./url-resolver";
import * as nodeSupport from "./node-support";
import {serveSystem} from "./system";

function getLoaderConfig(server: Server, topology: Topology): Object & Serializable {
    const hostname = server.address().address;
    const baseURL = `https://${hostname === '::' ? 'localhost' : hostname}:${server.address().port}`;
    return {
        baseURL,
        defaultJSExtensions: false,
        meta: {
            [topology.nodeMount.slice(1) + '/*']: {
                deps: [topology.nodeMount + '/' + nodeSupport.globals]
            }
        },
        serialize: function () {
            return JSON.stringify(this);
        }
    }
}

const responseHeaders = {
    'Content-type': 'application/javascript',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET'
};

function serveFile(res: ServerResponse, source: string | Readable) {
    const stream = typeof source === 'string'
        ? fs.createReadStream(source)
        : source;
    stream.once('data', () => {
        res.writeHead(200, responseHeaders);
    });
    stream.once('error', err => {
        res.writeHead(404, responseHeaders);
        res.end(err.toString());
    });
    stream.pipe(res);

}



/* TODO: normalize topology (leading/trailing slashes) */
export default function bundless(topology: Topology): Server {
    const config = spdyKeys;
    let loaderConfig: Serializable;
    const projectMap: Serializable = makeSerializable(getProjectMap(topology, { nodeLibs: true }));
    return spdy.createServer(config, function (req: ServerRequest, res: ServerResponse) {
        let urlPath:string;
        log('server >', req.method, req.url);
        if(req.url === topology.systemMount) {
            loaderConfig = loaderConfig || getLoaderConfig(this, topology);
            res.writeHead(200, responseHeaders);
            serveSystem(res, projectMap, loaderConfig);
        } else if(urlPath = testMountPoint(topology.nodeMount, req.url)) {
            serveFile(res, nodeSupport.resolveNodeUrl(urlPath));
        } else {
            const filePath: string = resolveUrlToFile(topology, req.url);
            if(filePath) {
                serveFile(res, filePath);
            } else {
                res.writeHead(404, responseHeaders);
                res.end();
            }

        }
    });
}

if(require.main === module) {
    const topology = {
        rootDir: process.cwd(),
        srcDir: 'dist',
        srcMount: '/modules',
        libMount: '/lib',
        nodeMount: '/$node',
        systemMount: '/$system'
    };
    bundless(topology).listen(4000, function () {
        console.log(`Bundless listening at ${this.address().address}:${this.address().port}`);
    });
}