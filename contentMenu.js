const Promise = require('bluebird');
const util = require('util');
const p = require('path');
const fs = Promise.promisifyAll(require('fs'));
const contentMenu = (path, baseUrl) => {
  return fs.readdirAsync(path)
  .map(file => {
    const stat = fs.statSync(p.join(path, file));
    if (stat.isDirectory()) {
      return contentMenu(p.join(path, file), p.join(baseUrl, file))
      .then((files) => ({
        url: p.join(baseUrl, file),
        children: files,
      }));
    } else {
      return {
        url: p.join(baseUrl, file),
      };
    }
  });
};

contentMenu('./content', '/').then(files => console.log(util.inspect(files, false, null)));
