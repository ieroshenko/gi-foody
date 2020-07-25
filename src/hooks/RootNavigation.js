import * as React from 'react';

export const navigationRef = React.createRef();

/**
 * Navigate to given to a screen from any View using hooks
 * @param name: name of the screen
 * @param params
 */
export function navigate(name, params) {
  navigationRef.current?.navigate(name, params);
}
