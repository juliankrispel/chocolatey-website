const gulp = require('gulp');
const watch = require('gulp-watch');
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
const content = () => fs.readFileSync('./src/shared/content.html').toString();

const config = {
  assetPath: 'assets',
  markdown: 'content',
};

const include = (fileName, options) => {
  const temp = fs.readFileSync(
    path.join('./src/shared', fileName + '.html')
  ).toString();

  return _.template(temp)(_.merge(templateOptions(), options));
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
  var title;
  content = transformLinks(content);
  var ast = marked.lexer(content);
  var links = ast.links;
  var headings = [];

  ast = ast.filter((item, index) => {
    if (index === 0 && item.type === 'heading' && item.depth === 1) {
      title = item.text;
      return false;
    }
    return true;
  });

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
    title,
    headings,
    html: marked.parser(ast),
  };
};

const markdown = (fileName) => {
  var content = fs.readFileSync(
    path.join(config.markdown, fileName + '.md')
  ).toString();
  return parseMarkdown(content);
};

const templateOptions = () => ({
  assetPath,
  markdown,
  include,
});

const streamCompile = (stream) => (
  stream.pipe(template(templateOptions()))
    .pipe(transform((filename) => (
      map((chunk, next) => (
        next(null, _.template(layout())(_.merge(templateOptions(), {content: chunk.toString()})))
      ))
    )))
    .pipe(gulp.dest('./dist')));

function markdownStream(stream) {
  return stream.pipe(transform((filename) => (
    map((chunk, next) => {
      const md = parseMarkdown(chunk.toString());
      const cont = _.template(content())(_.merge(templateOptions(), {md }));
      next(null, _.template(layout())(_.merge(templateOptions(), {content: cont})));
    })
  )))
  .pipe(rename({extname: '.html'}))
  .pipe(gulp.dest('./dist'))
}

gulp.task(
  'buildMarkdown',
  () => (
    markdownStream(gulp.src(['./content/*.md', '!./content/_*']))
  )
);

gulp.task(
  'buildHtml',
  () => (gulp.src('./src/*.html').pipe(template(templateOptions()))
  .pipe(transform((filename) => (
    map((chunk, next) => (
      next(null, _.template(layout())(_.merge(templateOptions(), {content: chunk.toString()})))
    ))
  )))
  .pipe(gulp.dest('./dist')))
);

gulp.task(
  'watchHtml',
  () => gulp.watch('./src/**/*', ['buildHtml'])
);

gulp.task(
  'watchMarkdown',
  () => gulp.watch('./content/**/*', ['buildMarkdown'])
);

const connectOpts = {
  root: 'dist',
  port: '8080',
};

gulp.task('serve', () => connect.server(connectOpts));

gulp.task('default', ['serve', 'watchHtml', 'watchMarkdown']);
