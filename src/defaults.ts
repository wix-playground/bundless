import _ = require('lodash');
import {collectDirInfo} from "./dir-structure";
import path = require('path');
import {Topology, ServerConfig, ProjectMapperOptions, ProjectInfo, BootstrapScriptOptions} from "./types";
const spdyKeys = require('spdy-keys');
import * as nodeSupport from './node-support';

export function generateProjectInfo(bootstrapOptions:BootstrapScriptOptions):ProjectInfo {
	const actualOptions:ProjectMapperOptions = _.merge({}, defProjectMapperOptions, bootstrapOptions.mapper);
	const srcDir = path.resolve(bootstrapOptions.rootDir, bootstrapOptions.srcDir);
	const libDir = path.resolve(bootstrapOptions.rootDir, 'node_modules');
	const excludeFromSrc: string[] = (path.resolve(bootstrapOptions.rootDir) === srcDir)
		? [libDir]
		: [];
	const projectInfo:ProjectInfo = {
		rootDir: bootstrapOptions.rootDir,
		srcDir: bootstrapOptions.srcDir,
		srcMount: bootstrapOptions.srcMount,
		libMount: bootstrapOptions.libMount,
		nodeMount: bootstrapOptions.nodeMount,
		systemMount: bootstrapOptions.systemMount,
		srcInfo: actualOptions.collector(srcDir, excludeFromSrc),
		libInfo: actualOptions.collector(libDir),
		nodeLibInfo: actualOptions.nodeLibs? actualOptions.collector(path.join(nodeSupport.rootDir, 'node_modules')) : undefined
	};
	return projectInfo;
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