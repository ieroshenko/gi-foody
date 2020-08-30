import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import React from 'react';

const IntroSlide = (props) => {
  const slide = props.slide;

  const slideCardStyle = {
    flex: 1,
    backgroundColor: slide.backgroundColor,
    alignItems: 'center',
  };
  return (
    <SafeAreaView style={slideCardStyle}>
      <View style={[slideCardStyle, {paddingTop: 30}]}>
        {/*<Text style={styles.title}>{slide.title}</Text>*/}
        <Image
          style={slide.key === 4 ? styles.horizontalImg : styles.img}
          source={slide.image}
        />
        <Text
          style={slide.key === 4 ? [styles.txt, {marginTop: 210}] : styles.txt}>
          {slide.text}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default IntroSlide;

const styles = StyleSheet.create({
  title: {
    fontFamily: 'System',
    fontSize: 40,
    marginTop: '7%',
    color: 'black',
    marginBottom: '7%',
  },
  img: {
    width: 300,
    height: 490,
    backgroundColor: 'white',
    borderRadius: 10,
  }, // 90 - 55
  horizontalImg: {width: 400, height: 200, borderRadius: 10, marginTop: 100},
  txt: {
    fontFamily: 'System',
    fontSize: 25,
    marginTop: 20,
    color: 'white',
    maxWidth: 250,
    alignSelf: 'center',
  },
});
