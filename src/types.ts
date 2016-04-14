import {Readable} from "stream";

export interface Serializable {
    serialize(): string | Readable;
}

export interface Topology {
    rootDir: string;
    baseUrl: string;
    srcDir: string;
}
