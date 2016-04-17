import {ProjectMap} from "./project-mapper";

function getExt(fileName: string): string {
    const slashIndex = fileName.lastIndexOf('/');
    const dotIndex = fileName.lastIndexOf('.');
    return (dotIndex > slashIndex) ? fileName.slice(dotIndex) : '';
}

function normalizeTail(name: string): string {
    const ext = getExt(name);
    if(ext === '.js' || ext === '.json') {
        return name;
    } else {
        return name + '.js';
    }
}

export function preProcess(projectMap: ProjectMap, name: string, parentName?: string, parentAddress?: string): string {
    const segments = name.split('/');
    const packageName = segments[0];
    if(packageName === '.' || packageName === '..') {
        const tail = segments.slice(1).join('/');
        return segments[0] + '/' + normalizeTail(tail);
    } else {
        if(packageName in projectMap.packages) {
            const [moduleSource, modulePath] = projectMap.packages[packageName];
            if(modulePath) {
                const tail = segments.length === 1 ? modulePath : segments.slice(1).join('/');
                return moduleSource + '/' + normalizeTail(tail);
            } else {
                return moduleSource;
            }
        } else {
            return normalizeTail(name);
        }
    }
}

export function postProcess(projectMap: ProjectMap, baseUrl: string, resolvedName: string): string {
    if(resolvedName.slice(0, baseUrl.length) === baseUrl && resolvedName.slice(-3) === '.js') {
        const dirIndex = projectMap.dirs.indexOf(resolvedName.slice(baseUrl.length-1));
        if(dirIndex > -1) {
            return resolvedName.slice(0, -3) + '/index.js';
        }
    }
    return normalizeTail(resolvedName);
}