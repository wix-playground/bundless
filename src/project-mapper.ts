import {Readable} from "stream";
import {Serializable, Topology} from "./types";
import fs = require('fs-extra');
import path = require('path');
import {supportedNodeLibs, resolveNodeLib} from "./node-support";
import objectAssign = require('object-assign');

function collectRelevantDirs(rootDir: string, relevantFile: string): string[] {
    const pkgList = [];
    
    function collect(dir: string) {
        const list: string[] = fs.readdirSync(dir);
        if(list.indexOf(relevantFile) > -1) {
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

    collect(rootDir);
    return pkgList;
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

function getNodeLibRoutes(): PackageDict {
    return supportedNodeLibs.reduce((acc: PackageDict, nodeLib: string) => {
        const {url, location} = resolveNodeLib(nodeLib);
        acc[url] = location;
        return acc;
    }, {} as PackageDict);
}

function buildPkgDict(topology: Topology, includeNodeLibs: boolean): PackageDict {
    const headLength = topology.rootDir.length + 'node_modules'.length + 1;
    const pkgList = collectRelevantDirs(path.join(topology.rootDir, 'node_modules'), 'package.json');
    const pkgDict: PackageDict = {};
    pkgList.forEach((pkgPath) => {
        const resolved: PackageTuple = resolvePackage(pkgPath);
        const pkg = topology.libMount + resolved[0].slice(headLength);
        pkgDict[path.basename(pkgPath)] = [pkg, resolved[1]];
    });
    const standardRoutes = includeNodeLibs ? getNodeLibRoutes() : {};
    return objectAssign(standardRoutes, pkgDict);
}

function collectDirs(rootDir: string, subDir: string, prefix: string): string [] {
    const headLength = rootDir.length + subDir.length + 1;
    return collectRelevantDirs(path.join(rootDir, subDir), 'index.js')
        .map(fullDir => prefix  + fullDir.slice(headLength) + '.js');
}

function buildDefIndexDirs(topology: Topology): string[] {
    return []
        .concat(collectDirs(topology.rootDir, topology.srcDir, topology.srcMount))
        .concat(collectDirs(topology.rootDir, 'node_modules', topology.libMount));
}

export type PackageTuple = [string, string];

export type PackageDict = { [pkgName: string]: PackageTuple };

export interface ProjectMap extends Serializable {
    packages: PackageDict;
    dirs: string[];
}

export function getProjectMap(topology: Topology, includeNodeLibs: boolean = false): ProjectMap {
    const projectMap: ProjectMap = {
        packages: buildPkgDict(topology, includeNodeLibs),
        dirs: buildDefIndexDirs(topology),
        serialize: () => projectMapSerialized
    };
    const projectMapSerialized: string = JSON.stringify(projectMap);
    return projectMap;
}
