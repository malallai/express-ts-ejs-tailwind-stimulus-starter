import { task, src, series, dest, watch } from "gulp";
import sourcemaps from 'gulp-sourcemaps';
import ts from 'gulp-typescript';
import path from 'path';
import tailwindcss from 'tailwindcss';
import postcss from 'gulp-postcss';
import concat from 'gulp-concat';
import nodemon from 'gulp-nodemon';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
const sass = require('gulp-sass')(require('sass'));
const clean = require('gulp-clean');

const paths = {
  buildDir: './build',
  tmpDir: './build/tmp',
  srcDir: './src',
  sources: {
    src: './src/assets',
    dest: './build/assets'
  }
};

const sources = {
  js: {
    src: `${paths.sources.src}/js/**/*`,
    dest: `${paths.sources.dest}/js`,
    tmp: `${paths.tmpDir}/js`,
    output: 'bundle.js',
    watch: [ `${paths.sources.src}/js/**/*.ts`, `${paths.sources.src}/js/**/*.js` ]
  },
  styles: {
    src: `${paths.sources.src}/stylesheets/**/*`,
    dest: `${paths.sources.dest}/stylesheets`,
    tmp: `${paths.tmpDir}/stylesheets`,
    output: 'styles.min.css',
    watch: [ `${paths.sources.src}/stylesheets/**/*.scss`, `${paths.sources.src}/stylesheets/**/*.css` ]
  },
  fonts: {
    src: `${paths.sources.src}/fonts/**/*`,
    dest: `${paths.sources.dest}/fonts`,
    watch: [ `${paths.sources.src}/fonts/**/*` ]
  },
  images: {
    src: `${paths.sources.src}/pictures/**/*`,
    dest: `${paths.sources.dest}/pictures`,
    watch: [
      `${paths.sources.src}/pictures/**/*.png`,
      `${paths.sources.src}/pictures/**/*.jpg`,
      `${paths.sources.src}/pictures/**/*.gif`,
      `${paths.sources.src}/pictures/**/*.svg`,
      `${paths.sources.src}/pictures/**/*.ico`,
      `${paths.sources.src}/pictures/**/*.webp`
    ]
  },
  views: {
    src: `${paths.srcDir}/views/**/*`,
    dest: `${paths.buildDir}/views`,
    watch: [ `${paths.srcDir}/views/**/*.ejs` ]
  },
  locales: {
    src: `${paths.srcDir}/locales/**/*`,
    dest: `${paths.buildDir}/locales`,
    watch: [ `${paths.srcDir}/locales/**/*.json` ]
  },
  serverFiles: {
    src: `${paths.srcDir}/**/*`,
    dest: `${paths.buildDir}`,
    watch: [ `${paths.srcDir}/**/*.ts` ]
  }
};

const configs = {
  tsConfig: './tsconfig.json',
  tsFrontConfig: `${paths.sources.src}/js/tsconfig.json`,
  tailwind: './tailwind.config.js',
  devEndpoint: 'build/index.js',
}

task('clean', () => {
  return src(paths.buildDir, { read: false, allowEmpty: true })
    .pipe(clean({force: true}));
});

task('build', series(async () => {
  let tsProject = ts.createProject(configs.tsConfig);
  let reporter = ts.reporter.fullReporter();
  let tsResult = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject(reporter));

  return tsResult.js
    .pipe(sourcemaps.write())
    .pipe(dest(paths.buildDir));
}));

task('styles', async () => {
  return src(sources.styles.src)
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(dest(sources.styles.tmp))
    .pipe(postcss([
      tailwindcss(configs.tailwind),
      require('autoprefixer'),
    ]))
    .pipe(concat({ path: sources.styles.output }))
    .pipe(dest(sources.styles.dest));
});

task('views', async () => {
  return src(sources.views.src)
    .pipe(dest(sources.views.dest));
});

task('locales', async () => {
  return src(sources.locales.src)
    .pipe(dest(sources.locales.dest));
});

task('fonts', async () => {
  return src(sources.fonts.src)
    .pipe(dest(sources.fonts.dest));
});

task('pictures', async () => {
  return src(sources.images.src)
    .pipe(dest(sources.images.dest));
});

task('front-js', async () => {
  let tsProject = ts.createProject(configs.tsFrontConfig);
  let reporter = ts.reporter.fullReporter();
  let tsResult = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject(reporter));

  return tsResult.js
    .pipe(sourcemaps.write())
    .pipe(dest(sources.js.tmp));
});

task('browserify', async () => {
  return browserify({ entries: sources.js.tmp, debug: true }).bundle()
    .pipe(source(path.join(sources.js.dest, sources.js.output)))
    .pipe(buffer())
    .pipe(dest('.'));
});

task('watch', async () => {
  watch(sources.serverFiles.watch, series('build'));
  watch(sources.js.watch, series('browserify', 'front-js'));
  watch(sources.styles.watch, series('styles'));
  watch(sources.views.watch, series('views'));
  watch(sources.locales.watch, series('locales'));
  watch(sources.fonts.watch, series('fonts'));
  watch(sources.images.watch, series('pictures'));
});

task('dev', series('clean', 'build', 'browserify', 'front-js', 'styles', 'views', 'locales', 'fonts', 'pictures', 'watch', async () => {
  console.log('Starting dev server after 2 seconds...');
  await sleep(2000);
  return nodemon({
    script: configs.devEndpoint,
    ext: 'js',
    env: {
      'NODE_ENV': 'development',
    },
  });
}));

task('prod', series('clean', 'build', 'browserify', 'front-js', 'styles', 'views', 'locales', 'fonts', 'pictures', async () => {
  console.log('Prod build done!');
}));

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
