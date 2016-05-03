const gulp = require('gulp');
const watch = require('gulp-watch');
const exec = require('child_process').exec;
const fs = require('fs');
const transform = require('vinyl-transform');
const map = require('map-stream');
const rename = require('gulp-rename');
const connect = require('gulp-connect');
const marked = require('marked');
const path = require('path');
const _ = require('lodash');
const template = require('gulp-template');

const layout = () => fs.readFileSync('./src/shared/layout.html').toString();
const layout404 = () => fs.readFileSync('./src/shared/404-layout.html').toString();
const contentLayout = () => fs.readFileSync('./src/shared/content-layout.html').toString();
const content = () => fs.readFileSync('./src/shared/content.html').toString();

const config = {
  assetPath: 'assets',
  docs: 'content/docs',
  csv: 'content/csv',
};

const include = (fileName, options) => {
  const temp = fs.readFileSync(
    path.join('./src/shared', fileName + '.html')
  ).toString();

  return _.template(temp)(_.merge(templateOptions(), options));
};

const csv = (fileName) => {
  const lines = fs.readFileSync(
    path.join(config.csv, fileName + '.csv')
    ).toString()
    .replace('""', '\\"')
    .split('\n').map(line => {
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
          if (match.index === 0 && isQuoted) {
            result.push('');
          } else if (match.index > 0 && !isQuoted){
            result[result.length - 1] += line.substr(0, match.index);
            line = line.substr(match.index + 1);
          }
        } else if (!isQuoted && line[match.index] === ',') {
          result.push(line.substr(0, match.index));
          line = line.substr(match.index + 1);
        } else if (result.length === 0) {
          result.push(line.substr(0, match.index));
          line = line.substr(match.index + 1);
        } else {
          result[result.length - 1] += line.substr(0, match.index + 1);
          line = line.substr(match.index + 1);
        }
      }

      return result;
    });

  return {
    header: lines[0],
    body: lines.splice(1),
  };
};

const assetPath = (filePath) => path.join(config.assetPath, filePath);


const transformLinks = (string) => {
  var content = string;
  const reg = /\[\[([^\]]+)\]\]/gi;
  var matches = [];
  var match;
  while ((match = reg.exec(content)) !== null) {
    matches.push(match[1]);
  }
  var c = content.replace(reg, (_, match) => {
    const ar = match.split('|');
    const title = ar[0];
    const link = ar[1] || ar[0];
    return `[${title}](${link})`;
  });
  return c;
};

const parseMarkdown = (content) => {
  // var title;
  content = transformLinks(content);
  var ast = marked.lexer(content);
  var links = ast.links;
  var headings = [];

  /*
  ast = ast.filter((item, index) => {
    if (index === 0 && item.type === 'heading' && item.depth === 1) {
      title = item.text;
      return false;
    }
    return true;
    });
  */

  ast.links = links;

  headings = ast.filter((node) => (
    node.type === 'heading' &&
    node.depth === 2
  ))
  .map((heading) => {
    const reg = /\[([^\]]+)\](?:\([^)]+\))?/gi;
    const text = heading.text.replace(reg, (_, match) => {
      return match;
    });
    return _.merge(
      heading,
      {text},
      {
        id: text.toLowerCase()
        .replace(/(?:\s|,|\.|\?|\(|\))+/gi, '-')
      }
    );
  });

  return {
    headings,
    html: marked.parser(ast),
  };
};

const markdown = (fileName) => {
  var content = fs.readFileSync(
    path.join(config.docs, fileName + '.md')
  ).toString();
  return parseMarkdown(content);
};

const templateOptions = () => ({
  assetPath,
  markdown,
  include,
  csv,
});

const streamCompile = (stream) => (
  stream.pipe(template(templateOptions()))
    .pipe(transform((filename) => (
      map((chunk, next) => (
        next(null, _.template(layout())(_.merge(templateOptions(), {content: chunk.toString()})))
      ))
    )))
    .pipe(gulp.dest('./dist')));

const markdownStream = (stream) => (
  stream.pipe(transform((filename) => (
    map((chunk, next) => {
      const md = parseMarkdown(chunk.toString());
      const cont = _.template(content())(_.merge(templateOptions(), {md }));
      next(null, _.template(contentLayout())(_.merge(templateOptions(), {content: cont})));
    })
  )))
  .pipe(rename({extname: '.html'}))
  .pipe(gulp.dest('./dist')));

gulp.task(
  'buildDocs',
  () => (markdownStream(gulp.src(['./content/docs/*.md', '!./content/docs/_*'])))
);

gulp.task(
  'buildHtml',
  () => (gulp.src('./src/*.html')
  .pipe(template(templateOptions()))
  .pipe(transform((filename) => {
    if (filename.indexOf('not_found') > 1) {
      return map((chunk, next) => (
        next(null, _.template(layout404())(_.merge(templateOptions(), {content: chunk.toString()})))
      ));
    }

    return map((chunk, next) => (
      next(null, _.template(layout())(_.merge(templateOptions(), {content: chunk.toString()})))
    ));
  }))
  .pipe(gulp.dest('./dist')))
);

gulp.task(
  'watchHtml',
  () => gulp.watch('./src/**/*', ['buildHtml'])
);

gulp.task(
  'watchDocs',
  () => (gulp.watch('./content/docs/**/*', ['buildDocs']))
);

const connectopts = {
  root: 'dist',
  port: '8080',
  middleware: (connect, opts) => {
    console.log(connect);
    return [];
  }
};

gulp.task('serve', () => exec('http-server ./dist -p 8888'));
gulp.task('build', ['buildDocs', 'buildHtml']);
gulp.task('default', ['serve', 'watchHtml', 'watchDocs']);
