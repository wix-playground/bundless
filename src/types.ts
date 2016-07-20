export type DirInfoDict = { [name: string]: DirInfo };

export interface DirInfo {
    name: string;
    path: string;
    children?: DirInfoDict;
    content?: Object;
    parent: DirInfo;
}

export interface ProjectInfo extends Topology{
    srcInfo:DirInfo;
    libInfo:DirInfo;
    nodeLibInfo?:DirInfo;
}

export interface DirInfoCollector {
    (rootDir: string, exclude?: string[]): DirInfo;
}

export interface Topology {
    rootDir?: string;
    srcDir?: string;
    srcMount?: string;
    libMount?: string;
    nodeMount?: string;
}

export interface ProjectMapperOptions {
    nodeLibs?: boolean;
    collector?: DirInfoCollector;
}

export interface BootstrapScriptOptions extends Topology {
    exportSymbol?: string;
    mapper?: ProjectMapperOptions;
}
