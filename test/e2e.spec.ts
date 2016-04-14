describe('e2e test', function () {
    it("loads root module and all its dependencies", function (done) {
        const element = <HTMLScriptElement> document.createElement('script');
        element.src = 'https://127.0.0.1:3000/$system';
        element.addEventListener('load', () => {
            System.import('main.js').then(() => done());
        });
        document.body.appendChild(element);
    });
});