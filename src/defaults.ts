import _ = require('lodash');
import {collectDirInfo} from "./dir-structure";
import {Topology, ServerConfig, ProjectMapperOptions, BootstrapScriptOptions} from "./types";
const spdyKeys = require('spdy-keys');

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