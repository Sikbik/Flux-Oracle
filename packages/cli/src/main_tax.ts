import { runTaxCli } from './tax.js';

const exitCode = await runTaxCli(process.argv.slice(2));
process.exitCode = exitCode;
