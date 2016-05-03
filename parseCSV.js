const path = require('path');
const fs = require('fs');

const file = fs.readFileSync(path.join('./content/csv/pricing.csv')
).toString();
const lines = file
.replace('""', '\\"')
.split('\n')
.map(line => {
  var result = [];
  var regex = /"|,/;
  var matches = [];
  var isQuoted = false;
  var index = 0;
  var match;
  while (line.length > 0) {
    match = regex.exec(line);
    if (!match) {
      result.push(line);
      line = '';
    } else if (line[match.index] === '"' && line[match.index - 1] !== '\\') {
      isQuoted = !isQuoted;
      line = line.substr(0, match.index) + line.substr(match.index + 1);
      if (match.index === 0) {
        result.push('');
      }
    } else if (!isQuoted && line[match.index] === ',') {
      result.push(line.substr(0, match.index));
      line = line.substr(match.index + 1);
    } else if (result.length === 0) {
      result.push(line.substr(0, match.index));
      line = line.substr(match.index + 1);
    } else {
      result[result.length - 1] += line.substr(0, match.index);
      line = line.substr(match.index + 1);
    }
  }

  return result;
});


console.log(lines);
