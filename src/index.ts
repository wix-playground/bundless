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
import {Topology, Serializable, ServerConfig} from "./types";
import {log} from "./logger";
import {resolveUrlToFile, testMountPoint} from "./url-resolver";
import * as nodeSupport from "./node-support";
import {serveSystem} from "./system";
import _ = require('lodash');

function getLoaderConfig(server: Server, topology: Topology): Object & Serializable {
    const hostname = server.address().address;
    const baseURL = `https://${hostname === '::' ? '127.0.0.1' : hostname}:${server.address().port}`;
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

function getResponseHeaders(source: string | Readable, cb: (err: Error, headers: Object) => void): void  {
    if(typeof source === 'string') {
        fs.stat(source, (err, stat: fs.Stats) => {
            if(err) {
                cb.call(null, err);
            } else {
                cb.call(null, null, _.assign({}, responseHeaders, {
                    'Last-Modified': stat.mtime.toUTCString(),
                    'Cache-Control': 'public, must-revalidate, max-age=0'
                }));
            }
        });
    } else {
        cb.call(null, null, responseHeaders);
    }
}

function serveFile(res: ServerResponse, source: string | Readable): void {
    getResponseHeaders(source, (err: Error, responseHeaders: Object) => {
        if(err) {
            res.writeHead(404);
            res.end();
        } else {
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
    });
}

function validateCache(req: ServerRequest, filePath: string, cb: (err: Error, cacheValid: boolean)=>void): void {
    if(req.headers['if-modified-since']) {
        const cachedTime = Date.parse(req.headers['if-modified-since']);
        fs.stat(filePath, (err: Error, stat: fs.Stats) => {
            if(err) {
                cb.call(null, null, false);
            } else {
                cb.call(null, null, stat.mtime.getTime() <= cachedTime);
            }
        });
    } else {
        cb.call(null, null, false);
    }
}

const defaultConfiguration: ServerConfig = {
    rootDir: process.cwd(),
    srcDir: 'dist',
    srcMount: '/modules',
    libMount: '/lib',
    nodeMount: '/$node',
    systemMount: '/$system',
    ssl: spdyKeys
};


/* TODO: normalize topology (leading/trailing slashes) */
export default function bundless(config: ServerConfig = {}): Server {
    const serverConfig: ServerConfig = _.assign({}, defaultConfiguration, config);
    let loaderConfig: Serializable;
    const projectMap: Serializable = makeSerializable(getProjectMap(serverConfig, { nodeLibs: true }));
    return spdy.createServer(serverConfig.ssl, function (req: ServerRequest, res: ServerResponse) {
        let urlPath:string;
        log('server >', req.method, req.url);
        if(req.url === serverConfig.systemMount) {
            loaderConfig = loaderConfig || getLoaderConfig(this, serverConfig);
            res.writeHead(200, responseHeaders);
            serveSystem(res, projectMap, loaderConfig);
        } else if(urlPath = testMountPoint(serverConfig.nodeMount, req.url)) {
            serveFile(res, nodeSupport.resolveNodeUrl(urlPath));
        } else {
            const filePath: string = resolveUrlToFile(serverConfig, req.url);
            if(filePath) {
                validateCache(req, filePath, (err: Error, isCacheValid: boolean) => {
                    if(isCacheValid) {
                        res.writeHead(304);
                        res.end();
                    } else {
                        serveFile(res, filePath);
                    }
                });
            } else {
                res.writeHead(404, responseHeaders);
                res.end();
            }

        }
    });
}

if(require.main === module) {
    bundless().listen(4000, function () {
        console.log(`Bundless listening at ${this.address().address}:${this.address().port}`);
    });
}