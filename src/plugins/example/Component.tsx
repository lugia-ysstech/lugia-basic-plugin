/**
 *
 * create by grg on 2020/9/8
 *
 * @flow
 */
import React from 'react';

type TypeProps = {
  actionId: string,
  listener: Object,
  designApi: Object,
  megaApi: Object,
}

type TypeState = {}

export default class Example extends React.Component<TypeProps, TypeState>{
  constructor(props: TypeProps) {
    super(props);
  }

  render () {
    return(
      <div>example</div>
    )
  }
}
