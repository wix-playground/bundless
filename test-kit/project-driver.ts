
class PackageBuilder {
    constructor(private rootDir: string) {}

    addFile(fileName: string, content: string = ''): PackageBuilder {
        return this;
    }

    addMainFile(fileName: string, content: string = ''): PackageBuilder {
        return this;
    }

    getPath(): string {
        return this.rootDir;
    }
}

export default function project(rootDir: string): PackageBuilder {
    return new PackageBuilder(rootDir);
}
