import {Topology} from "../src/types";
import express = require('express');
import {Application} from "express";
import path = require('path');
import * as bundless from '../src';
import {defTopology as defaultTopology} from '../src/defaults';
import _ = require('lodash');
import {Server} from "http";

function normalize(route: string): string {
    return route.replace(/[$]/g, () => '[$]');
}

export function createTestServer(topologyOverrides: Topology): Server {
    const topology: Topology = _.merge({}, defaultTopology, topologyOverrides);
    const app: Application = express();
    app.use(normalize(topology.libMount), express.static(path.resolve(topology.rootDir, 'node_modules')));
    app.use(normalize(topology.srcMount), express.static(path.resolve(topology.rootDir, topology.srcDir)));
    app.use(normalize(topology.nodeMount), express.static(path.resolve(bundless.nodeRoot, 'node_modules')));
    app.get(normalize('/$bundless'), (req, res) => {
        const script = bundless.generateBootstrapScript(topology);
        res.end(script);
    });
    return app;
}