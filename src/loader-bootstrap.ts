declare const locator;
declare const projectMap;
const origNormalize = System['normalize'];
System['normalize'] = function (name: string, parentName: string, parentAddress: string) {
    const newName = locator.preProcess(projectMap, name, parentName, parentAddress);
    return origNormalize.call(System, newName, parentName, parentAddress)
        .then(resolvedName => locator.postProcess(projectMap, System.baseURL, resolvedName));
};