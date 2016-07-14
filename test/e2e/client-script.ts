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
        return loadScript('http://127.0.0.1:3001/$bundless')
             .then(() => {
                 System.config({ baseURL: 'http://localhost:3001'})
                 window['$bundless'](System);
                 return System.import('main.js');
             });
    });
});