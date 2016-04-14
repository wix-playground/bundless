function loadSystem() {
    return new (window['Promise'])((resolve, reject) => {
        const element = <HTMLScriptElement> document.createElement('script');
        element.src = 'https://127.0.0.1:3000/$system';
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
        return loadSystem()
             .then(() => {
                 System.config({
                     baseURL: 'https://127.0.0.1:3000/',
                     meta: {
                         'scriptLoad': true
                     }
                 });
                 return System.import('main.js');
             });
    });
});