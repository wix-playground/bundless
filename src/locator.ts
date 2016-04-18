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

function resolveAsPackage(projectMap: ProjectMap, filePath: string): string {
    const segments = filePath.split('/').filter(ch => !!ch);
    const pkgName = segments[0];
    if(pkgName in projectMap.packages) {
        const [moduleSource, modulePath] = projectMap.packages[pkgName];
        if(modulePath) {
            const tail = segments.length === 1
                ? modulePath
                : segments.slice(1).join('/');
            return moduleSource + '/' + normalizeTail(tail);
        } else {
            return moduleSource;
        }
    } else {
        return normalizeTail(filePath);
    }
}

function isDefaultIndexDir(projectMap: ProjectMap, filePath: string): boolean {
    return projectMap.dirs.indexOf(filePath) > -1;
}

function stripJsExt(pathName: string): string {
    if(getExt(pathName) === '.js') {
        return pathName.slice(0,-3);
    } else {
        return pathName;
    }
}

export function extractPackageNames(baseUrl: string, libMount: string, filePath: string): string[] {
    const segments = filePath.slice(baseUrl.length).split('/');
    if(segments[0] === libMount) {
        return segments
            .slice(1)
            .reduce((acc: string[], segment: string, index: number, list: string[]) => {
                if(index === 0 || list[index-1] === 'node_modules') {
                    return acc.concat(segment);
                } else {
                    return acc;
                }
            }, []);
    } else {
        return [];
    }
}

export function joinUrl(baseUrl: string, ...paths: string[]): string {
    let result = baseUrl;
    paths.forEach(path => {
        if(result.charAt(result.length-1) !== '/') {
            result += '/';
        }
        if(path.charAt(0) === '/') {
            result += path.slice(1);
        } else {
            result += path;
        }
    });
    return result;
}

export function preProcess(projectMap: ProjectMap, name: string, parentName?: string, parentAddress?: string): string {
    const segments = name.split('/');
    const packageName = segments[0];
    if(packageName === '.' || packageName === '..') {
        if(segments.length === 1) {
            return name;
        } else {
            const tail = segments.slice(1).join('/');
            return segments[0] + '/' + normalizeTail(tail);
        }
    } else {
        const pkgMainFilePath = resolveAsPackage(projectMap, name);
        if(pkgMainFilePath) {
            return pkgMainFilePath;
        } else {
            return normalizeTail(name);
        }
    }
}

export function postProcess(projectMap: ProjectMap, baseUrl: string, resolvedName: string): string {
    const filePath: string = resolvedName.slice(baseUrl.length);
    if(isDefaultIndexDir(projectMap, '/' + filePath)) {
        return joinUrl(baseUrl, stripJsExt(filePath), 'index.js');
    } else {
        if(getExt(resolvedName) === '') {
            const pkgs = extractPackageNames(baseUrl, 'lib', resolvedName);
            if (pkgs.length > 0) {
                const pkgMainFilePath = resolveAsPackage(projectMap, pkgs[pkgs.length - 1]);
                if (pkgMainFilePath) {
                    return joinUrl(baseUrl, pkgMainFilePath);
                }
            }
        }
        return normalizeTail(resolvedName);
    }
}