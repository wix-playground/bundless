declare const locator;
declare const projectMap;

const logginOn = !!window.location.search.match(/[?&]log=true/);
const breakpointMatch = window.location.search.match(/[?&]bp=([^&]+)/);
const breakpointAt = breakpointMatch ? breakpointMatch[1] : null;
const log = logginOn ? console.log.bind(console, 'client >') : (...args:string[]) => {};


const origNormalize = System['normalize'];
System['normalize'] = function (name: string, parentName: string, parentAddress: string) {
    const newName = locator.preProcess(projectMap, name, parentName, parentAddress);
    log(`preProcess() ${name} -> ${newName}`);
    return origNormalize.call(System, newName, parentName, parentAddress)
        .then(resolvedName => {
            const result = locator.postProcess(projectMap, System.baseURL, resolvedName);
            log(`postProcess() ${name}: ${resolvedName} -> ${result}`);
            if(result === breakpointAt) {
                name, parentName, parentAddress, newName, resolvedName, result;
                debugger;
            }
            return result;
        });
};

const origTranslate = System['translate'].bind(System);
System['translate'] = function (load) {
    if(load.name.slice(-5) === '.json') {
        return 'module.exports = ' + load.source;
    } else {
        return origTranslate(load);
    }
};



window['process'] = window['process'] || { env: {}, argv: [] };