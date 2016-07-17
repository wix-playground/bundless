const Promise = (window['Promise']);
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const element = <HTMLScriptElement> document.createElement('script');
        element.src = url;
        element.addEventListener('load', () => {
            resolve();
        });
        element.addEventListener('error', () => {
            reject();
        });
        document.body.appendChild(element);
    });
}

describe('e2e test', function () {
    it("loads root module and all its dependencies", function () {
        this.timeout(100000);
        const config = window['__karma__'].config;
        const hostname = 'http://' + config.host + ':' + config.port.toString();
        return loadScript(hostname + '/$bundless')
             .then(() => {
                 System.config({ baseURL: config.baseURL });
                 window['$bundless'](System);
                 return System.import(config.mainModule);
             });
    });
});