
import {NewProjectMap, Topology} from "../types";

export function normalize(origNormalize, baseURL:string, locator, projectMap:Object, log = (...args:string[]) => {}, breakpointAt?:string){
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

interface DetectedPackage {
	pkg: string;
	head: string;
	tail: string[];
}

function detectPackage(projectMap: NewProjectMap, segments: string[]): DetectedPackage {
	if(projectMap.packages.indexOf(segments[1]) > -1) {
		return {
			pkg: segments[1],
			head: segments[0],
			tail: segments.slice(2)
		}
	}
}

function extractProtocol(url: string): { protocol: string, strippedUrl: string } {
	const index = url.indexOf('//');
	if(index === -1) {
		return {
			protocol: '',
			strippedUrl: url
		}
	} else {
		return {
			protocol: url.slice(0, index),
			strippedUrl: url.slice(index+2)
		}
	}
}

function join(...parts: string[]): string {
	return parts.join('/');
}

function remapUrl(url: string, projectMap: NewProjectMap, topology: Topology): string {
	const segments = url.split('/');
	const pkgName = segments[1];
	if(projectMap[pkgName]) {
		return join(segments[0], projectMap[pkgName]);
	} else {
		return url;
	}
}

export function fetch(oldFetch, projectMap: NewProjectMap, topology: Topology) {
	return function remappedFetch(load) {
		console.log(load);
		const { protocol, strippedUrl } = extractProtocol(load.address);
		load.address = normalizeTail(
			protocol + '//' + remapUrl(strippedUrl, projectMap, topology)
		);
		return oldFetch(load);
	}
}