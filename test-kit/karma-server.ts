import * as karma from 'karma';
import Promise = require("bluebird");

export function runKarma(host: string, port: number, mainModule: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const karmaServer = new karma.Server({
            port: 9876,
            configFile: process.cwd() + '/karma.conf.js',
            singleRun: true,
            client: {
                host,
                port,
                baseURL: `http://${host}:${port}`,
                mainModule
            }
        }, exitCode => resolve(null));
        karmaServer.on('run_complete', (browsers, results) => {
            if(results.error) {
                reject(new Error('Some tests have failed.'));
            }
        });
        karmaServer.start();
    });
}
