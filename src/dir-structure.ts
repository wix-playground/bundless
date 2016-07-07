import fs = require('fs-extra');
import path = require('path');
import os = require('os');
import {DirInfo, DirInfoDict} from "./types";
import _ = require('lodash');


const relevantFiles = ['package.json', 'bower.json', 'index.js'];

function normalizePath(pathName: string): string {
    return os.platform() === 'win32'
        ? pathName.replace(/\\/g, () => '/')
        : pathName;
}

function collect(rootDir: string, parent: DirInfo = null, exclude: string[] = []): DirInfo {
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
                const childPath = path.join(rootDir, name);
                if(!_.includes(exclude, childPath)) {
                    const childItem = collect(childPath, item, exclude);
                    if(childItem) {
                        acc[name] = childItem;
                    }
                }
                return acc;
            }, {});
        return item;
    } else {
        if(_.includes(relevantFiles, name)) {
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

export function collectDirInfo(rootDir: string, exclude: string[] = []): DirInfo {
    return collect(rootDir, null, exclude);
}