import {Topology} from "../src/types";
import express = require('express');
import {Application} from "express";
import path = require('path');
import * as bundless from '../src';
import {defTopology as defaultTopology} from '../src/defaults';
import _ = require('lodash');
import {Server} from "http";
import Promise = require('bluebird');
import {Request, Response} from "express";

function normalize(route: string): string {
    return route.replace(/[$]/g, () => '[$]');
}

function log() {
    return (req:Request, res:Response, next:Function) => {
        res.on('finish', () => {
            console.log(req.method, req.originalUrl, '->', res.statusCode);
        });
        next();
    }
}

export interface StaticServerOptions {
    debug: boolean;
}

const defaultServerOptions: StaticServerOptions = {
    debug: false
};

export function startStaticServer(host: string, port: number, topologyOverrides: Topology, options: StaticServerOptions = defaultServerOptions): Promise<Server> {
    const topology: Topology = _.merge({}, defaultTopology, topologyOverrides);
    const app: Application = express();
    if(options.debug) {
        app.use(log());
    }
    app.use(normalize(topology.libMount), express.static(path.resolve(topology.rootDir, 'node_modules')));
    app.use(normalize(topology.srcMount), express.static(path.resolve(topology.rootDir, topology.srcDir)));
    app.use(normalize(topology.nodeMount), express.static(path.resolve(bundless.nodeRoot, 'node_modules')));
    app.get(normalize('/$bundless'), (req, res) => {
        const script = bundless.generateBootstrapScript(topology);
        res.end(script);
    });
    return new Promise<Server>((resolve, reject) => {
        app.listen(port, host, function (err) {
            if(err) {
                reject(err);
            } else {
                resolve(this);
            }
        })
    });
}