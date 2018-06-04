#!/usr/bin/env node
const fs = require('fs-extra');
const meow = require('meow');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const _ = require('lodash');
const dbfilename = path.resolve('.symclair');

let db = {items:[
  // {realPath, filepath}
]};

if (fs.existsSync(dbfilename)){
  db = JSON.parse(fs.readFileSync(dbfilename));
}

meow(`
  symclair packages/*

    will replace all symlinks with real files and create ".symclair" in cwd to reverse the process

  symclair -x

     based on ".symclair" file, will remove real files (if exist) and generates symlinks. leaves the ".symclair" file so you will be able to recreate the symlinks at any moment with same command
`)

function rel(from, to){
  if (!to){
    to = from;
    from = process.cwd();
  }
  return path.relative(from,to);
}

if (argv.x) { // replace back to symlinks
 db.items.forEach(item=>{
   fs.removeSync(item.filepath);
   console.log('finding relative path', path.resolve(item.filepath), path.resolve(item.realPath));
   const relativePath = rel(path.dirname(path.resolve(item.filepath)), path.resolve(item.realPath));
   console.log('creating symlink at', path.resolve(item.filepath), 'with value', relativePath );
   fs.symlinkSync(relativePath, path.resolve(item.filepath));
 });

} else { // replace with real files
  const items = argv._.map(f=>({
    filepath: path.resolve(f),
    realPath: fs.realpathSync(f)
  })).filter(item=>item.realPath !== item.filepath);
  items.forEach(item=>{
    fs.removeSync(item.filepath);
    fs.copySync(item.realPath, item.filepath);
    const match = _.find(db.items, {filepath: rel(item.filepath)});
    if (!match){
      db.items.push(_.mapValues(item, (v)=>rel(v)));
    } else {
      match.realPath = rel(item.realPath);
      match.filepath = rel(item.filepath);
    }
  });

  fs.writeJsonSync(dbfilename, db);
}
