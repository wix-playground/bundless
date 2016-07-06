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
        return loadScript('https://127.0.0.1:3000/$system')
             .then(() => {
                 window['$bundless'](System);
                 return System.import('modules/main.js');
             });
    });
});