import * as React from 'react';

export const flatListRef = React.createRef();

/**
 * Scroll to top of the Tracking Journal using hooks
 */
export function scrollToTop() {
  flatListRef.current?.scrollToOffset({
    animated: true,
    offset: 0,
  });
}
