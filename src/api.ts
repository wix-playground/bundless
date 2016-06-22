import * as _hooks from './client/system-hooks';
import * as _locator from './client/locator';
export const hooks = _hooks;
export const locator = _locator;

export * from "./types";
export * from "./project-mapper";

export function hookSystemJs(systemJs:Object, baseURL:string, projectMap:Object, log?:(...args:string[])=>void, breakpointAt?:string):void{
	systemJs['normalize'] = hooks.normalize(systemJs['normalize'].bind(systemJs), baseURL, locator, projectMap, log, breakpointAt);
	systemJs['translate'] = hooks.translate(systemJs['translate'].bind(systemJs));
}