
export function normalize(origNormalize, baseURL, locator, projectMap, log = (...args:string[]) => {}, breakpointAt?){
	return function bundlessNormalize(name: string, parentName: string, parentAddress: string) {
		const newName = locator.preProcess(projectMap, name, parentName, parentAddress);
		log(`preProcess() ${name} -> ${newName}`);
		return origNormalize(newName, parentName, parentAddress)
			.then(resolvedName => {
				const result = locator.postProcess(projectMap, baseURL, resolvedName);
				log(`postProcess() ${name}: ${resolvedName} -> ${result}`);
				if(result === breakpointAt) {
					name, parentName, parentAddress, newName, resolvedName, result;
					debugger;
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
