const gulp = require('gulp');
const watch = require('gulp-watch');
const fs = require('fs');
const transform = require('vinyl-transform');
const map = require('map-stream');
const connect = require('gulp-connect');
const marked = require('marked');
const path = require('path');
const _ = require('lodash');
const template = require('gulp-template');


const layout = () => fs.readFileSync('./src/shared/layout.html').toString();

const config = {
  assetPath: 'assets',
  markdown: 'content',
};

const include = (fileName, options) => {
  const temp = fs.readFileSync(
    path.join('./src/shared', fileName + '.html')
  ).toString();

  return _.template(temp)(_.merge(templateOptions, options));
};

const assetPath = (filePath) => path.join(config.assetPath, filePath);

const markdown = (fileName) => {
  var content = fs.readFileSync(
    path.join(config.markdown, fileName + '.md')
  ).toString();

  var title;
  var ast = marked.lexer(content);
  var links = ast.links;

  ast = ast.filter((item, index) => {
    if (index === 0 && item.type === 'heading' && item.depth === 1) {
      title = item.text;
      return false;
    }
    return true;
  });

  ast.links = links;

  const headings = ast.filter((node) => (
    node.type === 'heading' &&
    node.depth === 2
  ))
  .map((heading) => {
    return _.merge(
      heading,
      {
        id: heading.text.toLowerCase()
        .replace(/\s+/gi, '-')
        .replace(/\?/gi, '-'),
      }
    );
  });

  return {
    title,
    headings,
    html: marked.parser(ast),
  };
};

const templateOptions = {
  assetPath,
  markdown,
  include,
};

const streamCompile = (stream) => (
  stream.pipe(template(templateOptions))
    .pipe(transform((filename) => (
      map((chunk, next) => (
        next(null, _.template(layout())(_.merge(templateOptions, {content: chunk.toString()})))
      ))
    )))
    .pipe(gulp.dest('./dist')));

gulp.task(
  'build',
  () => (gulp.src('./src/*.html').pipe(template(templateOptions))
  .pipe(transform((filename) => (
    map((chunk, next) => (
      next(null, _.template(layout())(_.merge(templateOptions, {content: chunk.toString()})))
    ))
  )))
  .pipe(gulp.dest('./dist'))));

gulp.task(
  'watch',
  () => gulp.watch(['./src/**/*', './content/**/*'], ['build']));

gulp.task('serve', () => connect.server({ root: 'dist', port: '8080' }));

gulp.task('default', ['serve', 'watch']);
