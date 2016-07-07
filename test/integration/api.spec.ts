import {expect} from 'chai';
import {hookSystemJs} from '../../src/api';
import {getProjectMap, ProjectMap} from "../../src/project-mapper";
import {PackageBuilder,  default as projectDriver} from "../../test-kit/project-driver";
import {Topology} from "../../src/types";
import {generateProjectInfo} from "../../src/defaults";
import tmp = require('tmp');
import * as Promise from 'bluebird';

const SystemJS = (typeof System === 'undefined') ? require('systemjs/dist/system.src') : System;
const SysConstructor = <any>SystemJS.constructor;

describe('system-hooks', function () {
	// https://github.com/systemjs/systemjs/issues/366#issuecomment-180057616
	let system, project, topology;

	beforeEach(() => {
		system = new SysConstructor();
		const tempDir = tmp.dirSync();
		project = projectDriver(tempDir.name);
		topology = {
			rootDir: project.getPath(),
			srcDir: 'dist',
			srcMount: '/local',
			libMount: '/__lib',
			nodeMount: '/$node',
			systemMount: '/$system',
			mapper: {
				nodeLibs: false
			}
		};
		system['fetch'] = function fetch(load) {
			expect(load.address).to.contain(topology.libMount);
			let path = load.address.substr(load.address.indexOf(topology.libMount)).replace(topology.libMount, 'node_modules');
			return Promise.resolve(project.readFile(path));
		};
	});
	it('normalize works with simple map', () => {
		project.addPackage('x')
			.addMainFile('index.js', `
					module.exports = require('./z');
				`)
			.addFile('z.js', `
					var yz = require('y/z');
					module.exports.foo = yz.bar;
				`);
		project.addPackage('y').addFile('z.js', `
				module.exports.bar = 'baz';
			`);
		hookSystemJs(system,  '__base', getProjectMap(generateProjectInfo(topology)));
		return system.import('x').then((imported) => {
			expect(imported.foo).to.eql('baz');
		});
	});
	it('normalize respects noJSExtension', () => {
		project.addPackage('x')
			.addMainFile('index.js', `
					module.exports = require('./FOO');
				`)
			.addFile('FOO', `
					var yz = require('y/z');
					module.exports.foo = yz.bar;
				`);
		project.addPackage('y').addFile('z.js', `
				module.exports.bar = 'baz';
			`);
		hookSystemJs(system,  '__base', getProjectMap(generateProjectInfo(topology)), undefined, undefined, /FOO/);
		return system.import('x').then((imported) => {
			expect(imported.foo).to.eql('baz');
		});
	});
});