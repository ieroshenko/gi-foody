import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {AreaChart, Grid, XAxis, YAxis} from 'react-native-svg-charts';
import Svg, {Path} from 'react-native-svg';
import * as shape from 'd3-shape';

const axesSvg = {fontSize: 10, fill: 'grey'};
const verticalContentInset = {top: 20, bottom: 10};
const xAxisHeight = 10;

const months = {
  '0': 'J',
  '1': 'F',
  '2': 'M',
  '3': 'A',
  '4': 'M',
  '5': 'J',
  '6': 'J',
  '7': 'A',
  '8': 'S',
  '9': 'O',
  '10': 'N',
  '11': 'D',
};

const convertDateToDisplayableX = (date) => {
  let monthStr = months[date.getMonth().toString()];

  return monthStr;
};

const Line = (props) => <Path d={props.line} stroke={'black'} fill={'none'} />;

const RenderCharts = (props) => {
  const statsData = props.statsData;
  const [isStaticChosen, setIsStaticChosen] = useState(false);
  const [staticIndex, setStaticIndex] = useState(0);

  useEffect(() => {
    for (let i = 0; i < statsData.length; i++) {
      let dataSymptomItem = statsData[i];

      if (dataSymptomItem.isVisible) {
        setStaticIndex(i);
        setIsStaticChosen(true);
        break;
      }
    }
  }, [statsData]);

  let axisData = statsData[0].statsData;

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          height: '100%',
          width: '100%',
        }}>
        <YAxis
          data={axisData}
          style={{width: 10}}
          contentInset={verticalContentInset}
          svg={axesSvg}
          min={0}
          max={10}
        />
        {isStaticChosen && (
          <AreaChart
            yMin={0}
            yMax={10}
            style={{height: '100%', width: '100%'}}
            data={
              statsData[staticIndex].isVisible
                ? statsData[staticIndex].statsData
                : [0]
            }
            svg={{
              fill: statsData[staticIndex].color,
            }}
            contentInset={verticalContentInset}
            curve={shape.curveMonotoneX}>
            <Grid />
            <Line color={statsData[staticIndex].color} />
          </AreaChart>
        )}
      </View>
      {isStaticChosen &&
        staticIndex + 1 < statsData.length &&
        statsData.slice(staticIndex + 1).map((symData) => {
          if (symData.isVisible) {
            return (
              <AreaChart
                yMin={0}
                yMax={10}
                style={{
                  height: '100%',
                  width: '100%',
                  position: 'absolute',
                  alignSelf: 'center',
                  left: 10,
                }}
                data={symData.statsData}
                svg={{
                  fill: symData.color,
                }}
                key={symData.symptomName}
                curve={shape.curveMonotoneX}
                contentInset={verticalContentInset}>
                <Line color={symData.color} />
              </AreaChart>
            );
          }
        })}
    </>
  );
};

const ChartsManager = (props) => {
  const statsData = props.statsData;

  return (
    <Svg>
      <View style={{width: '99%', height: '100%', paddingRight: 8}}>
        <RenderCharts statsData={props.statsData} />
      </View>
      <XAxis
        style={{
          height: xAxisHeight,
          width: '100%',
          marginHorizontal: 6,
        }}
        data={statsData[0].statsData}
        formatLabel={(value, index) => {
          let dataLen = statsData[0].statsData.length;
          if (dataLen <= 30) {
            let reverseIndex = dataLen - 1 - index;
            let currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - reverseIndex);

            let i = currentDate.getDate();

            let monthDisplay = convertDateToDisplayableX(currentDate);
            let x = `${monthDisplay}'${i}`;
            return x;
          } else {
            return '|';
          }
        }}
        contentInset={{left: 10, right: 10}}
        svg={axesSvg}
      />
    </Svg>
  );
};

export default ChartsManager;
