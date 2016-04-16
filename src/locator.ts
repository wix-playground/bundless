function getPackageName(name: string) {
    const index = name.indexOf('/');
    if(index === -1) {
        return name;
    } else {
        const packageName = name.slice(0,index-1);
        return packageName === '.' ? null : packageName;
    }
}

export function getModuleLocator(projectMap, oldNormalize) {
    return function normalize(name, parentName, parentAddress) {
        console.log('::', name, parentName, parentAddress);
        const packageName = getPackageName(name);
        if(packageName && packageName in projectMap.packages) {
            name = projectMap.packages[name];
        }
        return oldNormalize(name, parentName, parentAddress);
    }
}
