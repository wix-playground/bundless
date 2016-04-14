import {Readable} from "stream";

export interface SystemJsConfig {
    baseURL?: string;
    defaultJSExtensions?: boolean;
}

export interface ProjectMap {
    serialize(): string;
}

export function getProjectMap(rootDir: string, baseURL: string) {

    const projectMap = {
        system: {
            baseURL,
            defaultJSExtensions: true
        }
    };

    const projectMapSerialized: string = JSON.stringify(projectMap);

    return {
        serialize: () => projectMapSerialized
    }
}
