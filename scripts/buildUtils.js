const tsc = require('typescript');
const shell = require('shelljs');
const gulp = require('gulp');
const uglify = require('gulp-uglify');

const chalk = require('chalk');
const rimraf = require('rimraf');
const { readdirSync, existsSync } = require('fs');
const { join, basename } = require('path');
const chokidar = require('chokidar');
const slash = require('slash');
process.env.NODE_ENV = 'production';
const cwd = process.cwd();

// const BROWSER_FILES = ['packages/mega-utils/src/stripLastSlash.js'];
const BROWSER_FILES = [];

function isBrowserTransform(path) {
  return BROWSER_FILES.includes(path.replace(`${slash(cwd)}/`, ''));
}

function transform(opts = {}) {
  const { content, path } = opts;
  const winPath = slash(path);
  const isBrowser = isBrowserTransform(winPath);
  console.log(
    chalk[isBrowser ? 'yellow' : 'green'](`[TRANSFORM] ${winPath.replace(`${cwd}/`, '')}`)
  );
  let compilerOptions = {
    module: 'commonjs',
    declaration: true,
    sourceMap: true,
    target: 'es5',
    outDir: 'lib',
    importHelpers: true,
    moduleResolution: 'node',
    allowSyntheticDefaultImports: true,
    lib: ['esnext', 'dom'],
    types: ['jest'],
  };
  return tsc.transpile(String(content), compilerOptions);
}

function buildPkg() {
  const pkgPath = join(cwd, 'src');
  if (!existsSync(pkgPath)) {
    chalk.yellow(`[${pkgPath}] was not found`);
    return;
  }
  let outPutDir = join(pkgPath, 'lib');
  rimraf.sync(outPutDir);
  try {
    require('child_process').spawnSync(process.platform === 'win32' ? 'tsc.cmd' : 'tsc', [
      '-p',
      join(cwd, 'tsconfig.json'),
    ]);

    console.log(chalk.green(`[ReBuild] ${pkgPath} to ${outPutDir}`));
  } catch (e) {
    console.log(chalk.red('Compiled failed.'), e);
  }
}

function watch() {
  const watcher = chokidar.watch(join(cwd, './src'), {
    ignoreInitial: true,
  });
  watcher.on('all', (event, fullPath) => {
    fullPath = slash(fullPath);
    if (!existsSync(fullPath)) return;
    console.log(chalk.green(`[ReBuild]`));
    try {
      require('child_process')
        .spawn(process.platform === 'win32' ? 'tsc.cmd' : 'tsc', ['-p', join(cwd, 'tsconfig.json')])
        .on('close', () => {
          console.log(chalk.green(`[ReBuild]`));
        });
    } catch (e) {
      console.log(chalk.red('Compiled failed.'));
      console.log(chalk.red(e.message));
    }
  });
}

function build() {
  const { argv } = process;
  const isWatch = argv.includes('-w') || argv.includes('--watch');
  const minify = argv.includes('-m') || argv.includes('--minify');
  buildPkg(minify);
  if (isWatch) {
    watch();
  } else {
    uglifyPkg();
  }
}

function uglifyPkg() {
  let libPath = join(cwd, 'lib');
  gulp
    .src([`${libPath}/**/*.js`])
    // .pipe(uglify())
    .pipe(gulp.dest(join(libPath)));
}

function tsLint() {
  const dirs = readdirSync(join(cwd, packagesDirName));
  const { argv } = process;
  const fix = argv.includes('--fix');
  dirs.forEach(pkg => {
    if (pkg.charAt(0) === '.') return;
    console.info(pkg);
    shell.exec(`tslint ${fix ? '--fix' : ''} -p ${cwd}/${packagesDirName}/${pkg}`);
  });
}

module.exports = { buildPkg, build, watch, tsLint };
