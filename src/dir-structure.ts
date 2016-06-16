import fs = require('fs-extra');
import path = require('path');
import os = require('os');
import {DirInfo, DirInfoDict} from "./types";


const relevantFiles = ['package.json', 'bower.json', 'index.js'];

function normalizePath(pathName: string): string {
    return os.platform() === 'win32'
        ? pathName.replace(/\\/g, () => '/')
        : pathName;
}

export function collectDirInfo(rootDir: string, parent: DirInfo = null): DirInfo {
    let stat: fs.Stats;
    const name = path.basename(rootDir);
    const parentPath = parent ? parent.path : '';
    const item: DirInfo = {
        name,
        path: normalizePath(path.join(parentPath, name)),
        parent
    };
    try {
        stat = fs.statSync(rootDir);
    } catch (err) {
        return null;
    }

    if(stat.isDirectory()) {
        const list = fs.readdirSync(rootDir);
        item.children = list
            .reduce<DirInfoDict>((acc, name) => {
                const childItem = collectDirInfo(path.join(rootDir, name), item);
                if(childItem) {
                    acc[name] = childItem;
                }
                return acc;
            }, {});
        return item;
    } else {
        if(relevantFiles.indexOf(name)>-1) {
            if(name === 'package.json' || name === 'bower.json') {
                try {
                    item.content = JSON.parse(
                        fs.readFileSync(rootDir).toString()
                    );
                } catch (err) {}
            }
            return item;
        } else {
            return null;
        }
    }
}

