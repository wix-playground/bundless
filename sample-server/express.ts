import {Topology} from "../src/types";
import path = require('path');
import * as bundless from '../src';
import {defTopology as defaultTopology} from '../src/defaults';
import _ = require('lodash');
import {Router} from "express";

function normalize(route: string): string {
    return route.replace(/[$]/g, () => '[$]');
}

export default function createExpressRouter(express, topologyOverrides: Topology): Router {
    const topology: Topology = _.merge({}, defaultTopology, topologyOverrides);
    const script = bundless.generateBootstrapScript(topology);
    const app: Router = express();
    app.use(normalize(topology.libMount), express.static(path.resolve(topology.rootDir, 'node_modules')));
    app.use(normalize(topology.srcMount), express.static(path.resolve(topology.rootDir, topology.srcDir)));
    app.use(normalize(topology.nodeMount), express.static(path.resolve(bundless.nodeRoot, 'node_modules')));
    app.get(normalize('/$bundless'), (req, res) => res.end(script));
    return app;
}