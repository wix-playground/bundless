import {Readable} from "stream";
import {Serializable} from "./types";
import fs = require('fs-extra');
import path = require('path');

function collectRelevantDirs(rootDir: string): string[] {
    const pkgList = [];
    
    function collect(dir: string) {
        const list: string[] = fs.readdirSync(dir);
        if(list.indexOf('package.json') > -1) {
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

function resolvePackage(packagePath: string): string {
    let packageJson: Object;
    try {
        packageJson = JSON.parse(fs.readFileSync(path.resolve(packagePath, 'package.json')).toString());
    } catch (err) {
        packageJson = {};
    }
    if(packageJson['main']) {
        return path.resolve(packagePath, packageJson['main']);
    } else {
        return path.resolve(packagePath, 'index.js');
    }

}

function buildPkgDict(rootDir: string): PackageDict {
    const pkgList = collectRelevantDirs(path.resolve(rootDir, 'node_modules'));
    const pkgDict: PackageDict = {};
    pkgList.forEach((pkgPath) => {
        pkgDict[path.basename(pkgPath)] = path.relative(rootDir, resolvePackage(pkgPath));
    });
    return pkgDict;
}


export type PackageDict = { [pkgName: string]: string };

export interface ProjectMap extends Serializable {
    packages: PackageDict;
}

export function getProjectMap(rootDir: string): ProjectMap {
    const projectMap: ProjectMap = {
        packages: buildPkgDict(rootDir),
        serialize: () => projectMapSerialized
    };
    const projectMapSerialized: string = JSON.stringify(projectMap);
    return projectMap;
}
