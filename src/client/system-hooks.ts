
export function normalize(origNormalize, baseURL:string, locator, projectMap:Object, log = (...args:string[]) => {}, breakpointAt?:string, noJSExtension?:RegExp){
	return function bundlessNormalize(name: string, parentName: string, parentAddress: string) {
		const newName = locator.preProcess(projectMap, baseURL, name, parentName, parentAddress, noJSExtension);
		log(`preProcess() ${name} -> ${newName}`);
		return origNormalize(newName, parentName, parentAddress)
			.then(resolvedName => {
				const result = locator.postProcess(projectMap, baseURL, resolvedName, noJSExtension);
				log(`postProcess() ${name}: ${resolvedName} -> ${result}`);
				if(result === breakpointAt) {
					name, parentName, parentAddress, newName, resolvedName, result;		/* tslint:disable */
					debugger;	/* tslint:enable */
				}
				return result;
			});
	};
}

export function translate(origTranslate) {
	return function bundlessTranslate(load) {
		if(load.name.slice(-5) === '.json') {
			return 'module.exports = ' + load.source;
		} else {
			return origTranslate(load);
		}
	};
}
