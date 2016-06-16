import fs = require('fs');
import _ = require('lodash');
import {Topology} from "./types";
import * as nodeSupport from './node-support';
import {ProjectMap} from "./project-mapper";

function readModule(moduleId: string): string {
    return fs.readFileSync(require.resolve(moduleId)).toString();
}

export function generateBootstrapScript(topology: Topology, projectMap: ProjectMap, systemConfigOverrides?:Object, exportSymbol = '$bundless'): string {
    const defaultSystemConfig = {
        defaultJSExtensions: false,
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

    return [
            `var ${exportSymbol} = function (System) { var projectMap = `,
            JSON.stringify(projectMap),
            ';\n\n',
            'var locator = {};\n\n',
            '(function (exports){',
            readModule('./client/locator'),
            '\n\n})(locator);\n\n',
            `System.config(${systemConfig})\n\n`,
            readModule('./client/loader-bootstrap'),
            `\n\nreturn projectMap;\n};`
        ].join('\n');
}
