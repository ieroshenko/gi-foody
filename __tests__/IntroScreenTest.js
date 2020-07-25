/**
 * @format
 */

import 'react-native';
import React from 'react';
import IntroScreen from '../src/views/authentication/IntroScreen';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('IntroScreen renders correctly', () => {
  const intoScreenTree = renderer.create(<IntroScreen />).toJSON();
  expect(intoScreenTree).toMatchSnapshot();
});
