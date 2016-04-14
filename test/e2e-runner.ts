import {expect, assert} from 'chai';
import bundless from '../src';

import {Server, runner} from 'karma';

const host = '127.0.0.1';
const port = 3000;

bundless().listen(port, host, err => {
    if(err) {
        throw err;
    } else {
        console.log('Up and running', this)
        const server = new Server({
            port: 9876,
            configFile: process.cwd() + '/karma.conf.js',
            singleRun: true
        }, exitCode => {
            process.exit(exitCode);
        });
        server.start();
    }
});

