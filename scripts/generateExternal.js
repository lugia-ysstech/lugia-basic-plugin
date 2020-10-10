/**
 * Copyright (c) 2018-present, YSSTech, Inc.
 *
 * @emails lugia@ysstech.com
 * @author zenjava
 */



function widgetNameToDir (widgetName) {

  let result = [];
  let i = 0;
  for (const chr of widgetName) {

    if( i=== 0){
      result.push(chr.toLowerCase());
    }else{
      let ascCode = chr.codePointAt();
      if(ascCode >=65 && ascCode <=90){
        result.push(`-`);
        result.push(chr.toLowerCase());
      }else{
        result.push(chr.toLowerCase());
      }
    }
    i++;
  }

  return result.join('');
}


function genreate (param) {
  const result = [];

  for (const key of Object.keys(param)) {

    result.push(`require('expose-loader?${param[ key ]}!${key}'); // eslint-disable-line`);
  }
  return result.join('\n\r');
}


function generateWidgetName (...widgetNames) {

  const str = [];
  let result = widgetNames.reduce((obj, widgetName) => {
    widgetName = widgetNameToDir(widgetName);
    let key = `@lugia/lugia-web/dist/${widgetName}`;
    let value = `lugiaweb-${widgetName}`;
    obj[ key ] = value;
    str.push(`'${key}':'${value}'`);
    return obj;
  }, {});
  console.info(str.join(',\r\n'));
  console.info('----------------------------------------------------------------------------------');
  return result;
}
