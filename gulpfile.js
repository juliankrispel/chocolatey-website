const gulp = require('gulp');
const fs = require('fs');
const transform = require('vinyl-transform');
const map = require('map-stream');
const marked = require('marked');
const path = require('path');
const _ = require('lodash');
const template = require('gulp-template');
const layout = fs.readFileSync('./src/shared/layout.html').toString();

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

  const ast = marked.lexer(content);
  const headings = ast.filter((node) => node.type === 'heading')
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
    headings,
    html: marked.parser(ast),
  };
};

const templateOptions = {
  assetPath,
  markdown,
  include,
};

gulp.task(
  'default',
  () => (
    gulp.src('./src/*.html')
    .pipe(template(templateOptions))
    .pipe(transform((filename) => (
      map((chunk, next) => (
        next(null, _.template(layout)(_.merge(templateOptions, {content: chunk.toString()})))
      ))
    )))
    .pipe(gulp.dest('./dist'))
  ));
