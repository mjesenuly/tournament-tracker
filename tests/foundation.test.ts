import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, transaction } from '../server/db.js';
test('SQLite persists records after closing and reopening and rolls back invalid writes', () => {
 const dir=mkdtempSync(join(tmpdir(),'tt-')); const path=join(dir,'db.sqlite');
 try { let db=openDatabase(path); db.prepare('INSERT INTO users(id,email,name) VALUES(?,?,?)').run('captain','captain@example.test','Captain');
 assert.throws(()=>transaction(db,()=>{db.prepare('INSERT INTO users(id,email,name) VALUES(?,?,?)').run('temporary','temp@example.test','Temp');db.prepare('INSERT INTO tournaments(id,organizer_id,name) VALUES(?,?,?)').run('bad','missing','Invalid');}));
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get()?.n,1);db.close(); db=openDatabase(path);assert.equal(db.prepare('SELECT name FROM users WHERE id=?').get('captain')?.name,'Captain');
 const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>row.name);for(const name of ['tournaments','users','applications','memberships','fixtures','goals']) assert.ok(tables.includes(name));db.close();
 } finally {rmSync(dir,{recursive:true,force:true});}
});
