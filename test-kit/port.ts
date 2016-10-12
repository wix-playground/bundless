import Promise = require('bluebird');
const portfinder = require("portfinder");

export function findPort(startFrom: number): Promise<number> {
    portfinder.basePort = startFrom;
    return Promise.promisify<number>(portfinder.getPort)();

}
