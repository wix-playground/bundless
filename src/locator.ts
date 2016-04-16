import {ProjectMap, PackageTuple} from "./project-mapper";

function getExt(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex > -1 ? fileName.slice(dotIndex) : '';
}

function normalizeTail(name: string): string {
    const ext = getExt(name);
    return !!ext ? name : name + '.js';
}

function normalizePackageName(projectMap: ProjectMap, name: string): string {
    const segments = name.split('/');
    const packageName = segments[0];
    if(packageName === '.') {
        const tail = segments.slice(1).join('/');
        return segments[0] + '/' + normalizeTail(tail);
    } else {
        if(packageName in projectMap.packages) {
            const realPackagePath: PackageTuple = projectMap.packages[packageName];
            const tail = segments.length === 1 ? realPackagePath[1] : segments.slice(1).join('/');
            return realPackagePath[0] + '/' + normalizeTail(tail);
        } else {
            return normalizeTail(name);
        }
    }

}

export function preProcess(projectMap: ProjectMap, name: string, parentName?: string, parentAddress?: string): string {
    return normalizePackageName(projectMap, name);
}

export function postProcess(projectMap: ProjectMap, resolvedName: string, name: string, parentName?: string, parentAddress?: string): string {
    console.log('postProcess', resolvedName, '|', name, parentName, parentAddress);
    return resolvedName;
}