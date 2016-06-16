import _ = require('lodash');
import {collectDirInfo} from "./dir-structure";
const spdyKeys = require('spdy-keys');

export type DirInfoDict = { [name: string]: DirInfo };

export interface DirInfo {
    name: string;
    path: string;
    children?: DirInfoDict;
    content?: Object;
    parent: DirInfo;
}


export interface DirInfoCollector {
    (rootDir: string): DirInfo;
}


export interface Topology {
    rootDir?: string;
    srcDir?: string;
    srcMount?: string;
    libMount?: string;
    nodeMount?: string;
    systemMount?: string;
}

export interface Certificate {
    key: string;
    cert: string;
    ca?: string;
}

export interface ServerConfig extends Topology {
    ssl?: Certificate;
    forceHttp1?: boolean;
}

export interface ProjectMapperOptions {
    nodeLibs?: boolean;
    collector?: DirInfoCollector;
}


export interface BootstrapScriptOptions extends Topology {
    exportSymbol?: string;
    mapper?: ProjectMapperOptions;
}

export const defTopology: Topology = {
    rootDir: process.cwd(),
    srcDir: 'dist',
    srcMount: '/modules',
    libMount: '/lib',
    nodeMount: '/$node',
    systemMount: '/$system'
};



export const defServerConfig: ServerConfig = _.merge({}, defTopology, {
    ssl: spdyKeys,
    forceHttp1: false  
});

export const defProjectMapperOptions: ProjectMapperOptions = {
    nodeLibs: true,
    collector: collectDirInfo
};

export const defBootstrapScriptOptions: BootstrapScriptOptions = _.merge({}, defTopology, {
    exportSymbol: '$bundless',
    mapper: defProjectMapperOptions
});