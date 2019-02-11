/**
 * swiper
 */
import React, { Component } from 'react';
import {
    View,
    TouchableWithoutFeedback,
    ScrollView,
    Animated,
    InteractionManager,
    Text, StyleSheet,
    Dimensions,
    Platform
} from 'react-native'
import { px } from '../utils/Ratio'

const deviceWidth = Dimensions.get('window').width;


export default class extends Component {

    static defaultProps = {
        index: 0,
        horizontal: true,
        loop: true,
        ratio: 1,
        autoplayTimeout: 5,
        autoplayDirection: true,
        cardParams: {}
    };

    constructor(props) {
        super(props);

        this.refScrollView = this.refScrollView.bind(this)
        this.getRenderRowViews = this.getRenderRowViews.bind(this)
        this.updateAnimated = this.updateAnimated.bind(this)
        this.autoPlay = this.autoPlay.bind(this)
        this.stopAutoPlay = this.stopAutoPlay.bind(this)

        const { dataSource, width, height, horizontal, index, loop, ratio, autoplayTimeout, autoplayDirection, cardParams } = this.props;

        const side = horizontal ? width : height
        const cardSide = cardParams.cardSide || side * ratio
        const cardScale = cardParams.cardSmallSide ? cardParams.cardSmallSide / (horizontal ? height : width) : ratio
        this.ezswiper = {
            horizontal: horizontal,
            scrollToDirection: horizontal ? 'x' : 'y',
            side: side,
            ratio: ratio,
            cardParams: { cardSide: cardSide, cardScale: cardScale, cardTranslate: cardParams.cardSpace ? (side - cardSide + side * (1 - cardScale)) / 2 - cardParams.cardSpace : (side - cardSide + side * (1 - cardScale)) / 2 * 0.8 },
            dataSource: dataSource,
            count: dataSource.length,
            currentIndex: index,
            loop: loop,
            autoplayTimeout: autoplayTimeout,
            autoplayDirection: autoplayDirection,
        }

        this.scrollIndex = this.ezswiper.loop ? this.ezswiper.currentIndex + 1 : this.ezswiper.currentIndex

        const scaleArray = [];
        const translateArray = [];
        for (let i = 0; i < this.ezswiper.count + 2; i++) {
            scaleArray.push(new Animated.Value(1));
            translateArray.push(new Animated.Value(0));
        }
        this.state = { scaleArray, translateArray, currentIndex: index };

        this.events = {
            renderRow: this.renderRow.bind(this),
            onPress: this.onPress.bind(this),
            onWillChange: this.onWillChange.bind(this),
            onDidChange: this.onDidChange.bind(this),
        };
    }

    componentWillUnmount() {
        this.stopAutoPlay()
    }

    componentWillReceiveProps(nextProps) {
        this.stopAutoPlay()
        const { dataSource, width, height, horizontal, index, loop, ratio, autoplayTimeout, autoplayDirection, cardParams } = nextProps;

        const side = horizontal ? width : height
        const cardSide = cardParams.cardSide || side * ratio
        const cardScale = cardParams.cardSmallSide ? cardParams.cardSmallSide / (horizontal ? height : width) : ratio
        this.ezswiper = {
            horizontal: horizontal,
            scrollToDirection: horizontal ? 'x' : 'y',
            side: side,
            ratio: ratio,
            cardParams: { cardSide: cardSide, cardScale: cardScale, cardTranslate: cardParams.cardSpace ? (side - cardSide + side * (1 - cardScale)) / 2 - cardParams.cardSpace : (side - cardSide + side * (1 - cardScale)) / 2 * 0.8 },
            dataSource: dataSource,
            count: dataSource.length,
            currentIndex: index,
            loop: loop,
            autoplayTimeout: autoplayTimeout,
            autoplayDirection: autoplayDirection,
        }

        this.scrollIndex = this.ezswiper.loop ? this.ezswiper.currentIndex + 1 : this.ezswiper.currentIndex

        if (this.props.dataSource.length !== dataSource.length) {
            const scaleArray = [];
            const translateArray = [];
            for (let i = 0; i < this.ezswiper.count + 4; i++) {
                scaleArray.push(new Animated.Value(1));
                translateArray.push(new Animated.Value(0));
            }
            this.setState({ scaleArray, translateArray });
        }
        let timer = setTimeout(() => {
            // InteractionManager.runAfterInteractions(() => {
            this.scrollView && this.scrollView.scrollTo({ [this.ezswiper.scrollToDirection]: this.ezswiper.side * this.scrollIndex, animated: false });
            this.updateAnimated(this.scrollIndex, this.scrollIndex)
            this.autoPlay()
            this.setState({ initialized: true });
            if (timer) clearTimeout(timer)
            // });
        }, 100);
    }

    componentDidMount() {
        let timer = setTimeout(() => {
            InteractionManager.runAfterInteractions(() => {
                if (this.scrollView) this.scrollView.scrollTo({ [this.ezswiper.scrollToDirection]: this.ezswiper.side * this.scrollIndex, animated: false });
                this.updateAnimated(this.scrollIndex, this.scrollIndex)
                this.autoPlay()
                this.setState({ initialized: true });
                if (timer) clearTimeout(timer)
            });
        }, 100);

    }


    /**
    | -------------------------------------------------------
    | public api
    | -------------------------------------------------------
    */
    scrollTo(index, animated = true) {
        this.setState({ currentIndex: this.scrollIndex })
        this.scrollView && this.scrollView.scrollTo({ [this.ezswiper.scrollToDirection]: this.ezswiper.side * index, animated: animated });
    }

    /**
    | -------------------------------------------------------
    | private api
    | -------------------------------------------------------
    */
    updateAnimated(currentPageFloat, scrollIndex) {
        const { scaleArray, translateArray } = this.state;
        for (let i = 0; i < this.ezswiper.count + 2; i++) {
            if (i === scrollIndex) {
                scaleArray[i].setValue(1 - Math.abs(currentPageFloat - scrollIndex) * (1 - this.ezswiper.cardParams.cardScale));
                translateArray[i].setValue(this.ezswiper.cardParams.cardTranslate * (currentPageFloat - scrollIndex));
            } else if (i === scrollIndex - 1 || i === scrollIndex + 1) {
                scaleArray[i].setValue(this.ezswiper.cardParams.cardScale + Math.abs(currentPageFloat - scrollIndex) * (1 - this.ezswiper.cardParams.cardScale));
                translateArray[i].setValue((currentPageFloat - i) * this.ezswiper.cardParams.cardTranslate);
            } else {
                scaleArray[i].setValue(this.ezswiper.cardParams.cardScale);
                translateArray[i].setValue((currentPageFloat - i) * this.ezswiper.cardParams.cardTranslate);
            }

        }
    }

    refScrollView(view) {
        this.scrollView = view;
    }

    autoPlay() {
        this.stopAutoPlay()
        if (!this.ezswiper.loop || !this.ezswiper.autoplayTimeout) {
            return
        }

        this.autoPlayTimer = setTimeout(() => {
            this.scrollView && this.scrollView.scrollTo({ [this.ezswiper.scrollToDirection]: this.ezswiper.side * (this.scrollIndex + 1) });
            // this.scrollTo(this.scrollIndex + (this.ezswiper.autoplayDirection ? 1 : -1))
            let index = this.scrollIndex;
            if (index < 0) index = this.ezswiper.count - 1;
            if (index >= this.ezswiper.count) index = 0;
            this.onDidChange(this.ezswiper.dataSource[index], index)
        }, this.ezswiper.autoplayTimeout * 1000)

    }

    stopAutoPlay() {
        this.autoPlayTimer && clearTimeout(this.autoPlayTimer)
    }

    /**
    | -------------------------------------------------------
    |  events
    | -------------------------------------------------------
    */
    renderRow(obj, index) {
        if (typeof this.props.renderRow === 'function') {
            return this.props.renderRow(...arguments);
        }
    }

    onPress(obj, index) {
        if (typeof this.props.onPress === 'function') {
            return this.props.onPress(...arguments);
        }
    }

    onWillChange(obj, index) {
        if (typeof this.props.onWillChange === 'function') {
            return this.props.onWillChange(...arguments);
        }
    }

    onDidChange(obj, index) {
        if (typeof this.props.onDidChange === 'function') {
            return this.props.onDidChange(...arguments);
        }
    }
    /**
    | -------------------------------------------------------
    | ScrollView delegate
    | -------------------------------------------------------
    */

    lastPath = 0;
    lastDire = 1;


    lastXXX = 0;
    currDir = 0;
    onScroll(e) {
        let offset = e.nativeEvent.contentOffset[this.ezswiper.scrollToDirection];
        this.currDir = offset > this.lastXXX ? 1 : 0;
        this.lastXXX = offset;
        // // console.log(e.nativeEvent.contentOffset)
        this.lastDire = offset > this.lastPath ? 1 : -1;
        this.lastPath = offset;
        if (this.scrollView) {
            //     this.stopAutoPlay()
            if (this.ezswiper.loop) {
                if (Math.abs(offset - (this.ezswiper.count + 1) * this.ezswiper.side) < 20.1) {
                    offset = this.ezswiper.side
                    this.scrollView.scrollTo({ [this.ezswiper.scrollToDirection]: offset, animated: false });
                } else if (Math.abs(offset) < 20.1) {
                    offset = this.ezswiper.side * this.ezswiper.count
                    this.scrollView.scrollTo({ [this.ezswiper.scrollToDirection]: offset, animated: false });
                }
            }
            let currentPageFloat = offset / this.ezswiper.side;
            const currentPageInt = currentPageFloat % 1
            if (currentPageInt === 0 || currentPageInt >= 0.9) {
                currentPageFloat = Math.ceil(currentPageFloat)
                this.willIndex = undefined
                this.scrollIndex = currentPageFloat
                this.autoPlay()
            }

            //     const willIndex = Math.round(currentPageFloat);
            //     if (this.willIndex === undefined && willIndex !== this.scrollIndex) {
            //         this.willIndex = willIndex
            //         const dataSourceIndex = this.ezswiper.loop ? (this.willIndex + this.ezswiper.count - 1) % this.ezswiper.count : this.willIndex
            //         this.onWillChange(this.ezswiper.dataSource[dataSourceIndex], dataSourceIndex)
            //     }

            //     const oldIndex = this.ezswiper.currentIndex
            //     this.ezswiper.currentIndex = this.ezswiper.loop ? (this.scrollIndex + this.ezswiper.count - 1) % this.ezswiper.count : this.scrollIndex
            //     if (oldIndex !== this.ezswiper.currentIndex) {
            //         this.onDidChange(this.ezswiper.dataSource[this.ezswiper.currentIndex], this.ezswiper.currentIndex)
            //     }
            //     this.setState({ currentIndex: willIndex - 1 })
            //     this.updateAnimated(currentPageFloat, this.scrollIndex);
        }
    }

    onScrollEnd(e, offset) {
        if (this.scrollView) {
            this.stopAutoPlay()
            let offset = e.nativeEvent.contentOffset[this.ezswiper.scrollToDirection];
            let index = parseInt(offset / this.props.width);
            if (offset % this.props.width > 50) {
                index += this.currDir;
            }
            this.scrollView.scrollTo({ [this.ezswiper.scrollToDirection]: this.ezswiper.side * index });
            // this.onWillChange(this.ezswiper.dataSource[index - 1], index - 1)
            index--;
            if (index < 0) index = this.ezswiper.count - 1;
            if (index >= this.ezswiper.count) index = 0;
            this.onDidChange(this.ezswiper.dataSource[index], index)
            this.setState({ currentIndex: index })
            this.autoPlay()
        }
    }

    /**
    | -------------------------------------------------------
    | Render
    | -------------------------------------------------------
    */
    getRenderRowViews() {
        const { scaleArray, translateArray } = this.state;
        const { width, height } = this.props;

        const count = this.ezswiper.count + (this.ezswiper.loop ? 2 : 0);
        const margin = (this.ezswiper.side - this.ezswiper.cardParams.cardSide) / 2;
        const views = [];
        const maxIndex = this.ezswiper.count - 1

        for (let i = 0; i < count; i++) {
            const dataSourceIndex = this.ezswiper.loop ? (i + maxIndex) % this.ezswiper.count : i
            const currentItem = this.ezswiper.dataSource[dataSourceIndex]
            views.push(
                <View key={i} style={{ flexDirection: this.ezswiper.horizontal ? 'row' : 'column' }}>
                    <View style={{ [this.ezswiper.horizontal ? 'width' : 'height']: margin, backgroundColor: 'transparent' }} />
                    <TouchableWithoutFeedback onPress={() => this.events.onPress(currentItem, dataSourceIndex)}>
                        <Animated.View style={{ backgroundColor: 'transparent', width: this.ezswiper.horizontal ? this.ezswiper.cardParams.cardSide : width, height: this.ezswiper.horizontal ? height : this.ezswiper.cardParams.cardSide, transform: [{ [this.ezswiper.horizontal ? 'scaleY' : 'scaleX']: scaleArray[i] }, { [this.ezswiper.horizontal ? 'translateX' : 'translateY']: translateArray[i] }] }} >
                            {this.events.renderRow(currentItem, dataSourceIndex, this.state.currentIndex)}
                        </Animated.View>
                    </TouchableWithoutFeedback>
                    <View style={{ [this.ezswiper.horizontal ? 'width' : 'height']: margin, backgroundColor: 'transparent' }} />
                </View>
            );
        }
        return views;
    }

    getRenderRowLabel() {
        const views = [];
        const count = this.ezswiper.count;
        const maxIndex = this.ezswiper.count - 1;
        views.push(<View key={-1} style={[styles.label2, { width: this.state.currentIndex * 10 + 10 }]}></View>);
        for (let i = 0; i < count - this.state.currentIndex - 1; i++) {
            // const dataSourceIndex = this.ezswiper.loop ? (i + maxIndex) % this.ezswiper.count : i
            views.push(<View key={i} style={[styles.label]}></View>)
        }
        return views;
    }

    render() {
        const { width, height } = this.props;
        return (
            <View style={this.props.style}>
                <ScrollView
                    contentContainerStyle={{ backgroundColor: '#fff' }}
                    horizontal={this.ezswiper.horizontal}
                    // pagingEnabled
                    ref={this.refScrollView}
                    onScroll={e => this.onScroll(e)}
                    onScrollEndDrag={e => this.onScrollEnd(e)}
                    scrollEventThrottle={16}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}>
                    <View style={{ width: px(35) }}></View>
                    {this.getRenderRowViews()}
                    <View style={{ width: px(35) }}></View>
                </ScrollView>
                <View style={styles.bannerLabels}>
                    {this.getRenderRowLabel()}
                </View>
            </View>
        );
    }
}
const styles = StyleSheet.create({
    bannerLabels: {
        position: 'absolute',
        left: 0,
        bottom: px(60),
        width: deviceWidth,
        flexDirection: 'row',
        justifyContent: "center"
    },
    label: {
        backgroundColor: 'rgba(255,255,255,.5)',
        width: 4,
        height: 4,
        marginRight: 4,
        borderRadius: 2
    },
    label2: {
        backgroundColor: '#fff',
        width: 4,
        height: 4,
        marginRight: 4,
        borderRadius: 2
    }
})