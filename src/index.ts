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

export default function bundless(projectRootDir: string): Server {
    const config = spdyKeys;
    return spdy.createServer(config, (req: ServerRequest, res: ServerResponse) => {
        if(req.url in predefinedRoutes) {
            serveFile(res, predefinedRoutes[req.url]);
        } else {
            send404(res);
        }
    });
}
