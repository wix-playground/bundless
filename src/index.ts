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

const predefinedRoutes = {
    '/$system': serveSystem
};

const projectMap = '{}';

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

function resolveUrlToFile(rootDir: string, url: string): string {
    if(url in predefinedRoutes) {
        return predefinedRoutes[url];
    } else {
        return path.resolve(rootDir, url.slice(1));    
    }
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

function serveSystem(res: ServerResponse) {
    res.writeHead(200, {
        'Content-type': 'application/javascript'
    });
    seqStreams([
        streamSystemModule('systemjs/dist/system.js'),
        'var projectMap = {};\n\n',
        'var locator = '+ projectMap + ';\n\n',
        '(function (exports){',
        streamSystemModule('./locator'),
        '\n\n})(locator);\n\n',
        streamSystemModule('./loader-bootstrap')
    ], res);
}

export default function bundless(projectRootDir: string): Server {
    const config = spdyKeys;
    return spdy.createServer(config, (req: ServerRequest, res: ServerResponse) => {
        if(req.url in predefinedRoutes) {
            predefinedRoutes[req.url](res)
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

if(require.main === module) {
    bundless(process.cwd()).listen(3000, function () {
        console.log(`${this.address().address}:${this.address().port}`);
    })
}