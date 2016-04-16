export function log(...args): any {
    console.log.apply(console, args);
    return args[0];
}
