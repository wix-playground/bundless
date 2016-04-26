export function log(...args): any {
    if(process.env.BUNDLESS_DEBUG) {
        console.log.apply(console, args);
    }
    return args[0];
}
