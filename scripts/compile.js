/**
 *
 * create by grg on 2020/6/30
 *
 * @flow
 */

const kill = require('tree-kill');
const { outputJson, readJsonSync, ensureFileSync } = require('fs-extra');
const { join } = require('path');
const path = require('path');
const { fork } = require('child_process');

const moduleName = '@lugia/action-plugin';
const result = {};

function singleCompile (path, cwd) {
  const forkPath = join(path, './singleCompile.js');

  return fork(forkPath, [], {
    cwd,
    env: {
      NODE_ENV: 'production',
      __FROM_TEST: true,
      ESLINT: 'none',
      TSLINT: 'none',
      COMPRESS: 'none',
    },
    stdio: [null, 'ignore', null, 'ipc'],
  });
}

async function getAction (info) {
  const {
    pluginName,
    entryPath,
    outputDir: outputDirName,
  } = info;
  const outputDir = join(__dirname, outputDirName);
  const version = getPkgVersion();
  const targetName = `__${moduleName}__${pluginName}`;

  const buildAction = async () => {
    let action;
    const path = join(__dirname);
    const cwd = join(__dirname, entryPath);
    const entry = 'index.tsx';

    let processInfo;
    const lugiaResult = new Promise(async (resolve, reject) => {
      try {
        processInfo = singleCompile(path, cwd);
        processInfo
        .on('message', m => {
          if (m && m.SINGLE_COMPILED) {
            const { error, assets } = m;

            if (error) {
              reject(error);
            }

            if (assets) {
              const asset = assets.filter(a => a.name === 'index.js')[ 0 ] || null;
              action = {
                version,
                targetName,
                asset,
              };
              resolve(action);
            }
          } else {
            console.log('SINGLE_COMPILE_PATH message [', m, ']');
          }
        })
        .on('error', error => {
          const msg = error.toString();
          console.log('SINGLE_COMPILE_PATH error [', msg, ']');
          reject(msg);
        })
        .on('exit', code => {
          console.log('SINGLE_COMPILE_PATH exit [', code, ']');
        })
        .send({
          SINGLE_COMPILE: true,
          cwd,
          entry,
          name: targetName,
          // outputDir,
          publicPath: `file:///${outputDir.replace(/\\/g, '\\\\')}/`,
          disableCssExtract: true,
        });
      } catch (e) {
        console.info('error', e);
        reject(e);
      }
    });
    lugiaResult.finally(() => {
      if (processInfo.pid) {
        kill(processInfo.pid, 'SIGKILL');
      }
    });
    return lugiaResult;
  };

  return buildAction();
}

function getPkgVersion () {
  const { version } = readJsonSync(join(__dirname, '../package.json'));

  return version;
}

function parsePluginName(param){


  const names = param.split('');
  const path = [names[0].toLowerCase()];
  for(let i = 1;i < names.length; i++){
    const name = names[i];
    const code = name.codePointAt();
    if(code >= 65 && code <=90){
      path.push('-')
    }
    path.push(name.toLowerCase());
  }
  return path.join('');
}

async function compile (buildData) {

  console.info('需打包数量', buildData.length);
  const errPluginNames = [];
  for (let i = 0; i < buildData.length; i++) {
    let buildDatum = buildData[ i ];
    console.info(`打包${i + 1}:`, buildDatum);
    const {
      title: pluginTitle,
      desc: pluginDesc,
      userDef: pluginUserDef,
      type: pluginType,
      pluginName,
      size,
    } = buildDatum;
    try {


      let entryPath = `../src/plugins/${parsePluginName(pluginName)}`;
      const target = await getAction({...buildDatum, entryPath, outputDir: entryPath});
      const { targetName, asset } = target;
      result[ pluginName ] = {
        title: pluginTitle,
        desc: pluginDesc,
        userDef: pluginUserDef,
        type: pluginType,
        code: asset.content,
        targetName,
      };
      if(size){
        result[pluginName].size = size;
      }

      console.info('打包成功-------------------->', pluginName);

    } catch (err) {
      errPluginNames.push(pluginName);
      console.info('打包出错', err);
    }
  }

  console.info('打包失败的插件:', errPluginNames);
  const pluginDllPath = path.join(__dirname, '../pluginInfos.dll.json');
  ensureFileSync(pluginDllPath);
  return outputJson(pluginDllPath, result);
}

module.exports = compile;
