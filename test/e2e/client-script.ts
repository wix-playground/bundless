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

const karma = window['__karma__'];

function finish(result, errors) {
    karma.result({
        id: '',
        description: 'e2e',
        suite: [],
        success: result,
        skipped: null,
        time: 0,
        log: [],
        assertionErrors: errors
    });
    karma.complete();
}


const config = karma.config;
karma.info({ total: 1 });
karma.start = function () {
    loadScript(`${config.baseURL}$bundless`)
        .then(() => {
            System.config({ baseURL: config.baseURL });
            window['$bundless'](System);
            return System.import(config.mainModule)
                .catch(err => {
                    karma.log('ERROR', [err.message]);
                    finish(false, [err.message]);
                })
                .then(() => finish(true, []));
        });
};