import * as karma from 'karma';
import Promise = require("bluebird");
import {error} from "util";

export function runKarma(host: string, port: number, mainModule: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let success: boolean;
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
            if(success) {
                reject(new Error('Some tests have failed.'));
            } else {
                resolve(null);
            }
        });
        karmaServer.on('run_complete', (browsers, results) => {
            console.log('run_complete', results);
            success = results.error;
        });
        karmaServer.start();


    });
}
