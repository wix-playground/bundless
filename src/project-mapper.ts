import {Readable} from "stream";
import {Serializable} from "./types";

export interface SystemJsConfig {
    baseURL?: string;
    defaultJSExtensions?: boolean;
}

export interface ProjectMap extends Serializable {
}

export function getProjectMap(rootDir: string): ProjectMap {
    const projectMap = {};
    const projectMapSerialized: string = JSON.stringify(projectMap);
    return {
        serialize: () => projectMapSerialized
    }
}
