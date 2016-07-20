import _ = require('lodash');
import {collectDirInfo} from "./dir-structure";
import path = require('path');
import {Topology, ProjectMapperOptions, ProjectInfo, BootstrapScriptOptions} from "./types";
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
		srcInfo: actualOptions.collector(srcDir, excludeFromSrc),
		libInfo: actualOptions.collector(libDir),
		nodeLibInfo: actualOptions.nodeLibs? actualOptions.collector(path.join(nodeSupport.rootDir, 'node_modules')) : undefined
	};
	return projectInfo;
}

export const defTopology: Topology = {
	rootDir: process.cwd(),
	srcDir: 'src',
	srcMount: '/modules',
	libMount: '/lib',
	nodeMount: '/$node'
};

export const defProjectMapperOptions: ProjectMapperOptions = {
	nodeLibs: true,
	collector: collectDirInfo
};

export const defBootstrapScriptOptions: BootstrapScriptOptions = _.merge({}, defTopology, {
	exportSymbol: '$bundless',
	mapper: defProjectMapperOptions
});