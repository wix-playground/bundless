import * as karma from 'karma';
import Promise = require("bluebird");

export function startKarmaServer(host: string, port: number, mainModule: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
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
        }, exitCode => {
            console.log(`Karma server finished with exit code ${exitCode}`);
        });
        karmaServer.on('run_complete', (browsers, result) => {
            resolve(!result.error)
        });
        karmaServer.start();
    });
}


