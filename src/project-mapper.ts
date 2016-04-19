import {Serializable, Topology} from "./types";
import fs = require('fs-extra');
import path = require('path');
import semver = require('semver');
import { supportedNodeLibs, aliases, stubs, stubUrl, resolveNodePkg, nodeLibsRootDir } from "./node-support";
import objectAssign = require('object-assign');

function collectRelevantDirs(rootDir: string, isRelevantDir: (fileList: string[]) => boolean): string[] {
    const pkgList = [];
    
    function collect(dir: string) {
        const list: string[] = fs.readdirSync(dir);
        if(isRelevantDir(list)) {
            pkgList.push(dir);
        }
        list.forEach(fileName => {
            const fullName = path.resolve(dir, fileName);
            const stat = fs.statSync(fullName);
            if(stat.isDirectory()) {
                collect(fullName);
            }
        });
    }

    try {
        collect(rootDir);
        return pkgList;
    } catch(err) {
        return [];
    }
}

function resolvePackage(packagePath: string): PackageTuple {
    let packageJson: Object;
    try {
        packageJson = JSON.parse(fs.readFileSync(path.resolve(packagePath, 'package.json')).toString());
    } catch (err) {
        packageJson = {};
    }
    if(packageJson['main']) {
        return [packagePath, packageJson['main']];
    } else {
        return [packagePath, 'index.js'];
    }
}

function getPackageVersion(topology: Topology, pkgPath: PackageTuple): string {
    let packageJson: Object;
    const packageJsonPath = path.join(topology.rootDir, 'node_modules', pkgPath[0].slice(topology.libMount.length + 1), 'package.json');
    try {
        packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath).toString()
        );
        return packageJson['version'] || '0.0.0';
    } catch (err) {
        return '0.0.0';
    }
}

function resolvePkgVersion(topology: Topology, newPkgPath: PackageTuple, existingPkgPath: PackageTuple): PackageTuple {
    if(existingPkgPath) {
        const newVersion = getPackageVersion(topology, newPkgPath);
        const existingVersion = getPackageVersion(topology, existingPkgPath);
        if(semver.gt(newVersion, existingVersion)) {
            return newPkgPath;
        } else {
            return existingPkgPath;
        }
    } else {
        return newPkgPath;
    }
}

function override(pkgDict: PackageDict, key: string, localPath: string) {
    if(key in pkgDict) {
        pkgDict[key][1] = localPath;
    }
}

function buildPkgDict(topology: Topology): PackageDict {
    const headLength = topology.rootDir.length + 'node_modules'.length + 1;
    const pkgList = collectRelevantDirs(path.join(topology.rootDir, 'node_modules'), fileList => fileList.indexOf('package.json')>-1);
    const pkgDict: PackageDict = {};
    pkgList.forEach((pkgPath) => {
        const resolved: PackageTuple = resolvePackage(pkgPath);
        const pkg = topology.libMount + resolved[0].slice(headLength);
        const pkgKey = path.basename(pkgPath);
        pkgDict[pkgKey] = resolvePkgVersion(topology, [pkg, resolved[1]], pkgDict[pkgKey]);
    });
    override(pkgDict, 'superagent', 'superagent.js');
    override(pkgDict, 'socket.io-client', 'socket.io.js');
    return pkgDict;
}

function buildNodePkgDict(): PackageDict {
    const rootDir: string = path.dirname(require.resolve('node-libs-browser'));
    const headLength = rootDir.length + 'node_modules'.length + 1;
    const pkgList = collectRelevantDirs(path.join(rootDir, 'node_modules'), fileList => fileList.indexOf('package.json')>-1);
    const pkgDict: PackageDict = {};
    pkgList.forEach((pkgPath) => {
        const resolved: PackageTuple = resolveNodePkg(pkgPath) || resolvePackage(pkgPath);
        const pkg = '/$node' + resolved[0].slice(headLength);
        pkgDict[path.basename(pkgPath)] = [pkg, resolved[1]];
    });
    supportedNodeLibs.forEach(nodeLib => {
        const alias = aliases[nodeLib];
        if(alias) {
            pkgDict[nodeLib] = pkgDict[alias];
        }
    });
    stubs.forEach(nodeLib => {
        pkgDict[nodeLib] = stubUrl;
    });
    // exports._stream_duplex				= require.resolve('readable-stream/duplex.js');
    // exports._stream_passthrough			= require.resolve('readable-stream/passthrough.js');
    // exports._stream_readable			= require.resolve('readable-stream/readable.js');
    // exports._stream_transform			= require.resolve('readable-stream/transform.js');
    // exports._stream_writable			= require.resolve('readable-stream/writable.js');

    pkgDict['_stream_transform'] = ['/$node/readable-stream', 'transform.js'];
    pkgDict['inherits'] = ['/$node/util/node_modules/inherits', 'inherits_browser.js'];
    return pkgDict;
}

function collectDirs(rootDir: string, subDir: string, prefix: string): string [] {
    const headLength = rootDir.length + subDir.length + 1;
    return collectRelevantDirs(path.join(rootDir, subDir), fileList => fileList.indexOf('index.js')>-1 && fileList.indexOf('package.json') === -1)
        .map(fullDir => prefix  + fullDir.slice(headLength) + '.js');
}

function buildDefIndexDirs(topology: Topology, includeNodeLibs: boolean): string[] {
    return []
        .concat(collectDirs(topology.rootDir, topology.srcDir, topology.srcMount))
        .concat(collectDirs(topology.rootDir, 'node_modules', topology.libMount))
        .concat(includeNodeLibs ? collectDirs(nodeLibsRootDir, 'node_modules', '/$node') : []);
}

export type PackageTuple = [string, string];
export type PackageDict = { [pkgName: string]: PackageTuple };
export type SimplePackageMap = { [pkgName: string]: string };

export interface ProjectMap extends Serializable {
    packages: PackageDict;
    dirs: string[];
    nodelibs: SimplePackageMap;
}

export interface ProjectMapperOptions {
    nodeLibs?: boolean;
}

const defaultOptions: ProjectMapperOptions = {
    nodeLibs: false
};

export function getProjectMap(topology: Topology, options: ProjectMapperOptions = {}): ProjectMap {
    const actualOptions: ProjectMapperOptions = objectAssign({}, defaultOptions, options);
    const nodePackages: PackageDict = actualOptions.nodeLibs
        ? buildNodePkgDict()
        : {};
    const projectMap: ProjectMap = {
        packages: objectAssign({}, buildPkgDict(topology), nodePackages),
        dirs: buildDefIndexDirs(topology, actualOptions.nodeLibs),
        nodelibs: {},
        serialize: () => projectMapSerialized
    };
    const projectMapSerialized: string = JSON.stringify(projectMap);
    return projectMap;
}
