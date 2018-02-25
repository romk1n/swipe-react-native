import React, { Component } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_SCALE = 1.5;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_DURATION = 250;

class Deck extends Component {
  static defaultProps = {
    onSwipeLeft: () => {},
    onSwipeRight: () => {},
  };
  constructor(props) {
    super(props);

    const position = new Animated.ValueXY();
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) { // right
          this.forceSwipe(SWIPE_THRESHOLD);
        } else if (gesture.dx < -SWIPE_THRESHOLD) { // left
          this.forceSwipe(-SWIPE_THRESHOLD);
        } else {
          this.resetPosition()
        }
      },
    });

    this.state = {
      panResponder,
      position,
      index: 0
    };
  }

  componentWillReceiveProps(nextProps) {

    if (this.props.data !== nextProps.data) {
      this.setState({
        index: 0
      });
    }

  }

  componentWillUpdate() {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();
  }

  forceSwipe(direction) {
    const x = direction > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(this.state.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_DURATION
    }).start(() => this.onSwipeComplete(direction));
  }

  onSwipeComplete(direction) {

    const { onSwipeLeft, onSwipeRight, data } = this.props;
    let index = this.state.index;
    const item = data[index];

    direction > 0 ? onSwipeLeft(item) : onSwipeRight(item);
    this.state.position.setValue({ x: 0, y: 0});
    this.setState({index: index+1});
  }

  resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  }

  getStyleCard() {
    const { position } = this.state;
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * SCREEN_SCALE, 0, SCREEN_WIDTH * SCREEN_SCALE],
      outputRange: ['-120deg', '0deg', '120deg']
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  }

  renderCards() {
    const { index, panResponder } = this.state;
    const { data, renderCard, renderNoMoreCards } = this.props;

    if (index >= data.length) {
      return renderNoMoreCards();
    }

    return data.map((item, i) => {

      if (i < index ) { return null; }
      if (i === index) {
        return (
          <Animated.View
            key={item.id}
            style={[this.getStyleCard(), styles.cardStyle]}
            {...panResponder.panHandlers}
          >
            {renderCard(item)}
          </Animated.View>
        );
      }

      return (
        <Animated.View
          key={item.id}
          style={[styles.cardStyle, { top: 10 * (i -index), left: 2 * (i-index) }]}>
          {renderCard(item)}
        </Animated.View>
      );
    }).reverse();
  }

  render() {
    return (
      <View>
        {this.renderCards()}
      </View>
    );
  }
}

const styles = {
  cardStyle: {
    position: 'absolute',
    width: '100%'
  }
}

export default Deck;
