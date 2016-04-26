import {Readable} from "stream";

export interface Serializable {
    serialize(): string | Readable;
}

export interface Topology {
    rootDir: string;
    srcDir: string;
    srcMount: string;
    libMount: string;
    nodeMount: string;
    systemMount: string;
}
