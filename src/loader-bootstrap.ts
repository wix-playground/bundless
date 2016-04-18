declare const locator;
declare const projectMap;

const logginOn = false;
const log = logginOn ? console.log.bind(console, 'client >') : () => {};


const origNormalize = System['normalize'];
System['normalize'] = function (name: string, parentName: string, parentAddress: string) {
    const newName = locator.preProcess(projectMap, name, parentName, parentAddress);
    log(`preProcess() ${name} -> ${newName}`);
    return origNormalize.call(System, newName, parentName, parentAddress)
        .then(resolvedName => {
            const result = locator.postProcess(projectMap, System.baseURL, resolvedName);
            log(`postProcess() ${name}: ${resolvedName} -> ${result}`);
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


window['process'] = window['process'] || { env: {} };