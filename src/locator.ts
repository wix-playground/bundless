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
        return null;
    } else {
        if(packageName in projectMap.packages) {
            const realPackagePath: PackageTuple = projectMap.packages[packageName];
            const tail = segments.length === 1 ? realPackagePath[1] : segments.slice(1).join('/');
            return realPackagePath[0] + '/' + normalizeTail(tail);
        } else {
            return name;
        }
    }

}

export function getModuleLocator(projectMap: ProjectMap, oldNormalize) {
    return function normalize(name, parentName, parentAddress) {
        const newName = normalizePackageName(projectMap, name);
        return oldNormalize(newName || name, parentName, parentAddress);
    }
}
