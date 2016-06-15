import {Writable, Readable} from "stream";
import fs = require('fs');
import _ = require('lodash');
import {Topology} from "./types";
import * as nodeSupport from './node-support';

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

export interface Pipe {
    (res: Writable): void;
}

export function serveBootstrap(topology: Topology, projectMap: string | Readable, systemConfigOverrides?:Object, exportSymbol = '$bundless'): Pipe {
    const defaultSystemConfig = {
        meta: {
            [topology.nodeMount.slice(1) + '/*']: {
                deps: [topology.nodeMount + '/' + nodeSupport.globals]
            },
            '*': {
                format: 'cjs'
            }
        }
    };

    const systemConfig = JSON.stringify(
        _.merge({}, defaultSystemConfig, systemConfigOverrides)
    );
    
    return function pipe(res: Writable): void {
        seqStreams([
            `var ${exportSymbol} = function (System) { var projectMap = `,
            projectMap,
            ';\n\n',
            'var locator = {};\n\n',
            '(function (exports){',
                streamSystemModule('./client/locator'),
            '\n\n})(locator);\n\n',
            `System.config(${systemConfig})\n\n`,
            streamSystemModule('./client/loader-bootstrap'),
            `\n\n\n};\n${exportSymbol}(System);`
        ], res);
    }
    
}
