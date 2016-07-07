import {ProjectMap} from "./../project-mapper";

function getExt(fileName: string): string {
    const slashIndex = fileName.lastIndexOf('/');
    const dotIndex = fileName.lastIndexOf('.');
    return (dotIndex > slashIndex) ? fileName.slice(dotIndex) : '';
}

function normalizeTail(name: string, ignorePattern:RegExp): string {
    if (ignorePattern && name.match(ignorePattern)){
        return name;
    }
    const ext = getExt(name);
    if(ext === '.js' || ext === '.json') {
        return name;
    } else {
        return name + '.js';
    }
}

function resolveAsPackage(projectMap: ProjectMap, filePath: string, noJSExtension?:RegExp): string {
    const segments = filePath.split('/').filter(ch => !!ch);
    const pkgName = segments[0];
    if(pkgName in projectMap.packages) {
        const { p: moduleSource, m: modulePath} = projectMap.packages[pkgName];
        if(modulePath) {
            const tail = segments.length === 1
                ? modulePath
                : segments.slice(1).join('/');
            return moduleSource + '/' + normalizeTail(tail, noJSExtension);
        } else {
            return moduleSource;
        }
    } else {
        return normalizeTail(filePath, noJSExtension);
    }
}

function isDefaultIndexDir(projectMap: ProjectMap, filePath: string): boolean {
    const key = filePath.charAt(filePath.length - 1) === '/'
        ? filePath.slice(0, -1) + '.js'
        : filePath;
    return projectMap.dirs.indexOf(key) > -1;
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

export function preProcess(projectMap: ProjectMap, name: string, parentName?: string, parentAddress?: string, noJSExtension?:RegExp): string {
    const segments = name.split('/');
    const packageName = segments[0];
    if(packageName === '.' || packageName === '..') {
        if(segments.length === 1) {
            return name;
        } else {
            const tail = segments.slice(1).join('/');
            return segments[0] + '/' + normalizeTail(tail, noJSExtension);
        }
    } else {
        const pkgMainFilePath = resolveAsPackage(projectMap, name, noJSExtension);
        if(pkgMainFilePath) {
            return pkgMainFilePath;
        } else {
            return normalizeTail(name, noJSExtension);
        }
    }
}

export function postProcess(projectMap: ProjectMap, baseUrl: string, resolvedName: string, noJSExtension?:RegExp): string {
    const filePath: string = resolvedName.slice(baseUrl.length);
    if(isDefaultIndexDir(projectMap, '/' + filePath)) {
        return joinUrl(baseUrl, stripJsExt(filePath), 'index.js');
    } else {
        if(getExt(resolvedName) === '') {
            const pkgs = extractPackageNames(baseUrl, 'lib', resolvedName);
            if (pkgs.length > 0) {
                const pkgMainFilePath = resolveAsPackage(projectMap, pkgs[pkgs.length - 1], noJSExtension);
                if (pkgMainFilePath) {
                    return joinUrl(baseUrl, pkgMainFilePath);
                }
            }
        }
        return normalizeTail(resolvedName, noJSExtension);
    }
}