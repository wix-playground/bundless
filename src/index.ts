import fs = require('fs');
import path = require('path');
import _ = require('lodash');
import {defBootstrapScriptOptions, generateProjectInfo} from "./defaults";
import * as nodeSupport from './node-support';
import {BootstrapScriptOptions, ProjectInfo, ProjectMapperOptions, ProjectMap, getProjectMap} from "./api";

function readModule(moduleId:string):string {
    return fs.readFileSync(path.resolve(__dirname, moduleId)).toString();
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
            [bootstrapOptions.nodeMount.slice(1) + '/*']: {
                deps: [bootstrapOptions.nodeMount + '/' + nodeSupport.globals]
            },
            '*': {
                format: 'cjs'
            }
        }
    };

    const systemConfig = JSON.stringify(
        _.merge({}, defaultSystemConfig, systemConfigOverrides)
    );

    const projectMap:ProjectMap = getProjectMap(generateProjectInfo(bootstrapOptions));
    const loaderBootstrap = readModule('./client/loader-bootstrap.js');

    return `
(function () {
    var bootstrap = function (System) {
        var systemHooks = ${loadModule('./client/system-hooks.js')};
        var locator = ${loadModule('./client/locator.js')};
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
