import {Router} from "express";

export interface Topology {
    rootDir?: string;
    srcDir?: string;
    srcMount?: string;
    libMount?: string;
    nodeMount?: string;
}

export function express(topology: Topology): Router;
