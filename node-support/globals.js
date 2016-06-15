window['Buffer'] = window['Buffer'] || require('buffer').Buffer;
window['process'] = window['process'] || require('process');
process.version = '0.0.0';
process.cwd = function () { return ''; };
