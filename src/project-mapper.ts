import {Serializable, Topology} from "./types";
import fs = require('fs-extra');
import path = require('path');
import semver = require('semver');
import {aliases, stubUrl, nodeLibsRootDir, AliasValue} from "./node-support";
import objectAssign = require('object-assign');
import {collectDirInfo, DirInfo, traverseDirInfo, containsFile} from './dir-structure';
import _ = require('lodash');

function getPackageVersion(pkg: DirInfo): string {
    return pkg.children['package.json']['content']['version'] || '0.0.0';
}

function resolvePkgVersions(newPkg: DirInfo, existingPkg: DirInfo): DirInfo {
    const newVersion = getPackageVersion(newPkg);
    const existingVersion = getPackageVersion(existingPkg);
    if(semver.gt(newVersion, existingVersion)) {
        return newPkg;
    } else {
        return existingPkg;
    }
}

function resolveMainPkgFile(dirInfo: DirInfo, lookupBrowserJs: boolean = false): string {
    const pkgJson = dirInfo.children && dirInfo.children['package.json'] && dirInfo.children['package.json'].content;
    if(lookupBrowserJs && containsFile(dirInfo, 'browser.js')) {
        return 'browser.js';
    } else if(pkgJson && pkgJson['main']) {
        return pkgJson['main'];
    } else {
        return 'index.js';
    }
}

interface PackageDictOptions {
    lookupBrowserJs?: boolean
}

function buildPkgDict(dirInfo: DirInfo, libMount: string, options: PackageDictOptions = {}): PackageDict {
    const pkgDict: { [pkgName: string]: DirInfo } = {};
    traverseDirInfo(dirInfo, (node: DirInfo) => {
        if(node.name === 'package.json') {
            const pkg: DirInfo = node.parent;
            const pkgName = pkg.name;
            const existingVersion = pkgDict[pkgName];
            if(existingVersion) {
                pkgDict[pkgName] = resolvePkgVersions(pkg, existingVersion);
            } else {
                pkgDict[pkgName] = pkg;
            }
        }
    });

    const finalDict: PackageDict = {};
    for(let pkgName in pkgDict) {
        const pkg: DirInfo = pkgDict[pkgName];
        const pkgPath = libMount + pkg.path.slice(dirInfo.path.length);
        const mainFilePath = resolveMainPkgFile(pkg, options.lookupBrowserJs);
        finalDict[pkgName] = [pkgPath, mainFilePath];
    }
    
    return finalDict;
}

function collectIndexDirs(root: DirInfo, prefix: string): string[] {
    const list: string[] = [];
    traverseDirInfo(root, (node: DirInfo) => {
        if(node.name === 'index.js' && !('package.json' in node.parent.children)) {
            const url = prefix + node.parent.path.slice(root.path.length) + '.js';
            list.push(url);
        }
    });
    return list;
}

export type PackageTuple = [string, string];
export type PackageDict = { [pkgName: string]: PackageTuple };

export interface ProjectMap {
    packages: PackageDict;
    dirs: string[];
}

export interface ProjectMapperOptions {
    nodeLibs?: boolean;
}

const defaultOptions: ProjectMapperOptions = {
    nodeLibs: false
};

function getNodeLibMap(): ProjectMap {
    const nodeLibStructure: DirInfo = collectDirInfo(path.join(nodeLibsRootDir, 'node_modules'));
    const packages: PackageDict = buildPkgDict(nodeLibStructure, '/$node', { lookupBrowserJs: true });
    _.forEach(aliases, (target: AliasValue, alias: string) => {
        if(typeof target === 'string') {
            packages[alias] = packages[target];
        } else if(target === null) {
            packages[alias] = stubUrl;
        } else {
            packages[alias] = target;
        }
    });

    const dirs = collectIndexDirs(nodeLibStructure, '/$node');
    return { packages, dirs };
}

function mergeProjectMaps(map1: ProjectMap, map2: ProjectMap): ProjectMap {
    return {
        packages: objectAssign({}, map1.packages, map2.packages),
        dirs: map1.dirs.concat(map2.dirs)
    };
}

export function getProjectMap(topology: Topology, options: ProjectMapperOptions = {}): ProjectMap {
    const actualOptions: ProjectMapperOptions = objectAssign({}, defaultOptions, options);

    const srcDirStructure: DirInfo = collectDirInfo(path.join(topology.rootDir, topology.srcDir));
    const libDirStructure: DirInfo = collectDirInfo(path.join(topology.rootDir, 'node_modules'));
    const packages: PackageDict = buildPkgDict(libDirStructure, topology.libMount);
    const dirs: string[] = []
        .concat(collectIndexDirs(srcDirStructure, topology.srcMount))
        .concat(collectIndexDirs(libDirStructure, topology.libMount));

    const projectMap: ProjectMap = {
        packages,
        dirs
    };

    if(actualOptions.nodeLibs) {
        return mergeProjectMaps(projectMap, getNodeLibMap());
    } else {
        return projectMap;
    }
}

export function makeSerializable(obj: Object): Serializable {
    const serialized: string = JSON.stringify(obj);
    obj['serialize'] = () => serialized;
    return <Serializable>obj;
}