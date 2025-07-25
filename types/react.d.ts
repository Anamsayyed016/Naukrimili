import * as React from 'react';
import * as ReactDOM from 'react-dom';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export = React;
export as namespace React;
