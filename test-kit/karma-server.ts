import * as karma from 'karma';
import Promise = require("bluebird");

export function startKarmaServer(host: string, port: number, basePath: string, mainModule: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        const karmaServer = new karma.Server({
            port: 9876,
            configFile: process.cwd() + '/karma.conf.js',
            singleRun: true,
            browserNoActivityTimeout: 100000,
            client: {
                baseURL: `http://${host}:${port}${basePath}`,
                mainModule
            }
        }, exitCode => {
            console.log(`Karma server finished with exit code ${exitCode}`);
        });
        karmaServer.on('run_complete', (browsers, result) => {
            if(result.exitCode === 0) {
                resolve(!result.error);
            } else {
                reject(`Karma exited with code ${result.exitCode}`);
            }
        });
        karmaServer.start();
    });
}


