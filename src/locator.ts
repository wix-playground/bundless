function getExtension(moduleName: string): string {
    const index = moduleName.lastIndexOf('.');
    return index > -1 ? moduleName.slice(index) : '';
}

export function getModuleLocator(projectMap, oldNormalize) {
    return function normalize(name, parentName, parentAddress) {
        if(name in projectMap.packages) {
            name = projectMap.packages[name];
        }
        console.log('::', name, parentName, parentAddress);
        return oldNormalize(name, parentName, parentAddress);
    }
}
