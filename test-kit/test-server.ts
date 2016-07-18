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
import bundlessExpress from "../sample-server/express";

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
    const app: Application = express();
    if(options.debug) {
        app.use(log());
    }
    app.use(bundlessExpress(express, topologyOverrides));
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