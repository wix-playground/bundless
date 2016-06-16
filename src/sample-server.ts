import {Server} from "http";
const spdy = require('spdy');
import fs = require('fs');
import path = require('path');
import {ServerRequest} from "http";
import {ServerResponse} from "http";
import * as http from "http";
import stream = require('stream');
import {Readable} from "stream";
import {ServerConfig, defServerConfig} from "./types";
import {log} from "./logger";
import {resolveUrlToFile} from "./url-resolver";
import {generateBootstrapScript} from "./index";
import _ = require('lodash');

function getLoaderConfig(server: Server, serverConfig: ServerConfig): Object {
    const protocol = serverConfig.forceHttp1 ? 'http' : 'https';
    const hostname = server.address().address;
    const baseURL = `${protocol}://${hostname === '::' ? '127.0.0.1' : hostname}:${server.address().port}`;
    return {
        baseURL
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
                this.end();
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


/* TODO: normalize topology (leading/trailing slashes) */
export default function bundless(config: ServerConfig = {}): Server {
    const serverConfig: ServerConfig = _.merge(defServerConfig, config);
    let bootstrapScript: string;

    const handler = function (req: ServerRequest, res: ServerResponse) {
        log('server >', req.method, req.url);
        if(req.url === serverConfig.systemMount) {
            if(!bootstrapScript) {
                 bootstrapScript = generateBootstrapScript(serverConfig, getLoaderConfig(this, serverConfig))
            }

            // TODO: add bootstrap script caching
            res.writeHead(200, responseHeaders);
            res.end(bootstrapScript);
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
    };
    return serverConfig.forceHttp1
        ? http.createServer(handler)
        : spdy.createServer(serverConfig.ssl, handler);
}

if(require.main === module) {
    bundless().listen(4000, function () {
        console.log(`Bundless listening at ${this.address().address}:${this.address().port}`);
    });
}