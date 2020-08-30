import * as React from 'react';

export const navigationRef = React.createRef();

export const isReadyRef = React.createRef();

/**
 * Navigate to given to a screen from any View using hooks
 * @param name: name of the screen
 * @param params
 */
export function navigate(name, params) {
  console.log(name);
  if (isReadyRef.current && navigationRef.current) {
    navigationRef.current?.navigate(name, params);
  } else {
    console.log('nav ref isn not ready');
  }
}

export function goBack() {
  if (
    isReadyRef.current &&
    navigationRef.current &&
    navigationRef.current.canGoBack
  ) {
    navigationRef.current?.goBack();
  }
}
