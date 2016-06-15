import {Readable} from "stream";

export interface Topology {
    rootDir?: string;
    srcDir?: string;
    srcMount?: string;
    libMount?: string;
    nodeMount?: string;
    systemMount?: string;
}

export interface Certificate {
    key: string;
    cert: string;
    ca?: string;
}

export interface ServerConfig extends Topology {
    ssl?: Certificate;
    forceHttp1?: boolean;
}