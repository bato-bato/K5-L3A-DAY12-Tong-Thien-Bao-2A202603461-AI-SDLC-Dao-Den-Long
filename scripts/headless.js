import {readFile} from 'node:fs/promises';
import {replay} from '../src/game.js';
try {
 const filename=process.argv[2];
 if(!filename)throw Error('Usage: node scripts/headless.js <scenario.json>');
 const {actions}=JSON.parse(await readFile(filename,'utf8'));
 console.log(JSON.stringify(replay(actions)));
} catch(error){console.error(error.message);process.exitCode=1;}