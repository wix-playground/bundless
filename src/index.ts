import fs = require('fs');
import _ = require('lodash');
import {BootstrapScriptOptions, defBootstrapScriptOptions, Topology} from "./types";
import * as nodeSupport from './node-support';
import {ProjectMap, getProjectMap} from "./project-mapper";

function readModule(moduleId:string):string {
    return fs.readFileSync(require.resolve(moduleId)).toString();
}
function loadModule(moduleId:string){
    return `(function () {
        var exports = {};
        ${readModule(moduleId)}
        return exports;
        })();`;
}
export {rootDir as nodeRoot} from './node-support';

export function generateBootstrapScript(options: BootstrapScriptOptions = {}, systemConfigOverrides:Object = {}): string {
    const bootstrapOptions: BootstrapScriptOptions = _.merge({}, defBootstrapScriptOptions, options);
    const defaultSystemConfig = {
        defaultJSExtensions: false,
        meta: {
            [options.nodeMount.slice(1) + '/*']: {
                deps: [options.nodeMount + '/' + nodeSupport.globals]
            },
            '*': {
                format: 'cjs'
            }
        }
    };

    const systemConfig = JSON.stringify(
        _.merge({}, defaultSystemConfig, systemConfigOverrides)
    );

    const projectMap:ProjectMap = getProjectMap(<Topology>bootstrapOptions, bootstrapOptions.mapper);
    const locator = readModule('./client/locator');
    const loaderBootstrap = readModule('./client/loader-bootstrap');

    return `
(function () {
    var bootstrap = function (System) {
        var systemHooks = ${loadModule('./client/system-hooks')};
        var locator = ${loadModule('./client/locator')};
        var projectMap = ${JSON.stringify(projectMap)};
        System.config(${systemConfig});
        ${loaderBootstrap};
        return projectMap;
    };
    if(typeof module === 'undefined') {
        window["${bootstrapOptions.exportSymbol}"] = bootstrap;
    } else {
        module.exports = bootstrap;
    }
})()  
    `;

}
