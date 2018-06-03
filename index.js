const fs = require('fs-extra');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
console.log(argv._);

argv._.map(f=>({
  filepath: path.resolve(f),
  realPath: fs.realpathSync(f)
})).filer(item=>item.realPath !== item.filepath).forEach(item=>{
  fs.copySync(item.realPath, item.filepath);
});
