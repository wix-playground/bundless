declare const systemHooks;
declare const locator;
declare const projectMap;

const logginOn = !!window.location.search.match(/[?&]log=true/);
const breakpointMatch = window.location.search.match(/[?&]bp=([^&]+)/);
const breakpointAt = breakpointMatch ? breakpointMatch[1] : null;
const log = logginOn ? console.log.bind(console, 'client >') : (...args:string[]) => {};

const origNormalize = System['normalize'].bind(System);
const origTranslate = System['translate'].bind(System);

System['normalize'] = systemHooks.normalize(origNormalize, System.baseURL, locator, projectMap, log, breakpointAt);

System['translate'] = systemHooks.translate(origTranslate);


window['process'] = window['process'] || { env: {}, argv: [] };