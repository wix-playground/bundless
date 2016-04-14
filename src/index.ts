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

export default function bundless(): Server {
    const config = spdyKeys;
    return spdy.createServer(config, (req: ServerRequest, res: ServerResponse) => {
        if(req.url in predefinedRoutes) {
            serveFile(res, predefinedRoutes[req.url]);
        }
    });
}
