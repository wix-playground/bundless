import {Server} from "http";
const spdy = require('spdy');
const spdyKeys = require('spdy-keys');
import fs = require('fs');
import path = require('path');
import {ServerRequest} from "http";
import {ServerResponse} from "http";

const predefinedRoutes = {
    '/$system': path.resolve(process.cwd(), 'node_modules/systemjs/dist/system.js')
};

function serveFile(res: ServerResponse, filePath: string) {
    fs.createReadStream(filePath).pipe(res);
}

function send404(res: ServerResponse) {
    res.writeHead(404);
    res.end('');
}

function resolveUrlToFile(rootDir: string, url: string): string {
    return path.resolve(rootDir, url.slice(1));
}

export default function bundless(projectRootDir: string): Server {
    const config = spdyKeys;
    return spdy.createServer(config, (req: ServerRequest, res: ServerResponse) => {
        if(req.url in predefinedRoutes) {
            serveFile(res, predefinedRoutes[req.url]);
        } else {
            const filePath: string = resolveUrlToFile(projectRootDir, req.url);
            try {
                serveFile(res, filePath);
            } catch (err) {
                send404(res);
            }
        }
    });
}
