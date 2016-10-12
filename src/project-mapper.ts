import {Topology, ProjectInfo, DirInfo} from "./types";
import {defProjectMapperOptions} from "./defaults";
import path = require('path');
import semver = require('semver');
import * as nodeSupport from "./node-support";
import _ = require('lodash');

function getPackageVersion(pkg: DirInfo): string {
    return pkg.children['package.json']['content']['version'] || '0.0.0';
}

function resolveFileRemapping(pkg: DirInfo): FileRemapping {
    const browserProp = pkg.children['package.json']['content']['browser'];
    if(browserProp && typeof browserProp === 'object') {
        return browserProp;
    } else {
        return null;
    }
}

export function traverseDirInfo<T>(root: DirInfo, visitor: (node: DirInfo) => void): void {
    if(root) {
        visitor.call(null, root);
        if(root.children) {
            for(let childName in root.children) {
                traverseDirInfo(root.children[childName], visitor);
            }
        }
    }
}

function calcDepth(dirInfo: DirInfo, currentDepth: number = 0): number {
    if(dirInfo.parent) {
        return calcDepth(dirInfo.parent, currentDepth+1);
    } else {
        return currentDepth;
    }
}

function resolvePkgVersions(newPkg: DirInfo, existingPkg: DirInfo): DirInfo {
    const newVersion = getPackageVersion(newPkg);
    const existingVersion = getPackageVersion(existingPkg);
    if(semver.eq(newVersion, existingVersion)) {
        if(calcDepth(existingPkg) > calcDepth(newPkg)) {
            return newPkg;
        } else {
            return existingPkg;
        }
    } else if(semver.gt(newVersion, existingVersion)) {
        return newPkg;
    } else {
        return existingPkg;
    }
}

/** @deprecated */
function resolveBowerMainFile(dirInfo: DirInfo): string {
    const result = _.property<DirInfo, string | string[]>(['children', 'bower.json', 'content', 'main'])(dirInfo);
    if(typeof result === 'string') {
        return result;  
    } else if(typeof result === 'object') {
        return result[0];
    }
}

function resolveJspmMainFile(dirInfo: DirInfo): string {
    return _.property<DirInfo, string>(['children', 'package.json', 'content', 'jspm', 'main'])(dirInfo);
}

function resolvePackageJsonMainFile(dirInfo: DirInfo): string {
    const browserProp = _.property<DirInfo, Object | string>(['children', 'package.json', 'content', 'browser'])(dirInfo);
    if(typeof browserProp === 'string') {
        return browserProp;
    } else {
        return _.property<DirInfo, string>(['children', 'package.json', 'content', 'main'])(dirInfo);
    }
}

function resolveMainPkgFile(dirInfo: DirInfo): string {
    return resolveJspmMainFile(dirInfo) ||
        resolvePackageJsonMainFile(dirInfo) ||
        'index.js';
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
        const mainFilePath = resolveMainPkgFile(pkg);
        const remapping: FileRemapping = resolveFileRemapping(pkg);
        const pkgRec: PackageRec = { p: pkgPath, m: mainFilePath };
        if(remapping) {
            pkgRec.r = remapping;
        }
        finalDict[pkgName] = pkgRec;
    }
    
    return finalDict;
}

function joinUrls(url1: string, url2: string): string {
    if(_.last(url1) === '/' && _.first(url2) === '/') {
        return url1 + url2.slice(1);
    } else {
        return url1 + url2;
    }
}

function collectIndexDirs(root: DirInfo, prefix: string): string[] {
    const list: string[] = [];
    traverseDirInfo(root, (node: DirInfo) => {
        if(node.name === 'index.js' && !('package.json' in node.parent.children)) {
            const url = joinUrls(prefix, node.parent.path.slice(root.path.length) + '.js');
            list.push(url);
        }
    });
    return list;
}

// These properties have short names because we're trying to make the project map as small as possible

export type FileRemapping = { [fileName: string]: (string | boolean) };

export type PackageRec = {
    p: string;  // package path
    m: string;  // main file local path
    r?:  FileRemapping;
};

export type PackageDict = { [pkgName: string]: PackageRec };

export interface ProjectMap {
    libMount: string;
    packages: PackageDict;
    dirs: string[];
}


function getNodeLibMap(nodeMount: string, nodeLibStructure: DirInfo): ProjectMap {
    const packages: PackageDict = buildPkgDict(nodeLibStructure, nodeMount, { lookupBrowserJs: true });
    _.forEach(nodeSupport.aliases, (aliasValue: nodeSupport.AliasValue, alias: string) => {
        if(typeof aliasValue === 'string') {
            packages[alias] = packages[aliasValue];
        } else if(aliasValue === null) {
            packages[alias] = { p: nodeMount, m: nodeSupport.stubPath };
        } else {
            packages[alias] = aliasValue(packages);
        }
    });

    const dirs = collectIndexDirs(nodeLibStructure, nodeMount);
    return { libMount: '', packages, dirs };
}

function mergeProjectMaps(map1: ProjectMap, map2: ProjectMap): ProjectMap {
    return {
        libMount: map1.libMount,
        packages: _.assign<any, PackageDict, PackageDict, PackageDict>({}, map1.packages, map2.packages),
        dirs: map1.dirs.concat(map2.dirs)
    };
}

export function getProjectMap(projInfo: ProjectInfo): ProjectMap {

    const packages: PackageDict = buildPkgDict(projInfo.libInfo, projInfo.libMount);
    const dirs: string[] = []
        .concat(collectIndexDirs(projInfo.srcInfo, projInfo.srcMount))
        .concat(collectIndexDirs(projInfo.libInfo, projInfo.libMount));

    const projectMap: ProjectMap = {
        libMount: projInfo.libMount.slice(1),
        packages,
        dirs
    };

    if(projInfo.nodeLibInfo) {
        return mergeProjectMaps(projectMap, getNodeLibMap(projInfo.nodeMount, projInfo.nodeLibInfo));
    } else {
        return projectMap;
    }
}
