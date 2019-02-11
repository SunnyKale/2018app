'use strict';

import React from 'react';
import {
    StyleSheet,
    Dimensions,
    Animated,
    Text,
    TouchableWithoutFeedback,
    View,
    Easing
} from 'react-native';
import { px } from '../../utils/Ratio';

let noop = () => {
};

let { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
let DEFAULT_ARROW_SIZE = new Size(10, 5);

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Size(width, height) {
    this.width = width;
    this.height = height;
}

function Rect(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

let Popover = class extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            contentSize: {},
            anchorPoint: {},
            popoverOrigin: {},
            placement: 'auto',
            isTransitioning: false,
            defaultAnimatedValues: {
                scale: new Animated.Value(0),
                translate: new Animated.ValueXY(),
                fade: new Animated.Value(0),
            },
        }
    }
    static defaultProps = {
        isVisible: false,
        displayArea: new Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT),
        arrowSize: DEFAULT_ARROW_SIZE,
        placement: 'auto',
        onClose: noop,
    }

    measureContent(x) {
        let { width, height } = x.nativeEvent.layout;
        let contentSize = { width, height };
        let result = this.computeGeometry({ contentSize });
        let geom = result.geom;
        let placement = result.placement;
        //var geom = this.computeGeometry({contentSize});

        let isAwaitingShow = this.state.isAwaitingShow;
        this.setState(
            Object.assign(geom, { contentSize, isAwaitingShow: undefined }),
            () => {
                isAwaitingShow && this._startAnimation({ show: true });
            }
        );
        this.setState({ placement });
    }
    computeGeometry({ contentSize, placement }) {
        placement = placement || this.props.placement;

        let options = {
            displayArea: this.props.displayArea,
            fromRect: this.props.fromRect,
            arrowSize: this.getArrowSize(placement),
            contentSize,
        }

        switch (placement) {
        case "top":
            return {
                placement: "top",
                geom: this.computeTopGeometry(options)
            };
        case "bottom":
            return {
                placement: "bottom",
                geom: this.computeBottomGeometry(options)
            };
        case "left":
            return {
                placement: "left",
                geom: this.computeLeftGeometry(options)
            };
        case "right":
            return {
                placement: "right",
                geom: this.computeRightGeometry(options)
            };
        default:
            return this.computeAutoGeometry(options);
            // Because this method itself return the tuple we want
            return this.computeAutoGeometry(options);
        }
    }
    computeTopGeometry({ displayArea, fromRect, contentSize, arrowSize }) {
        let popoverOrigin = new Point(
            Math.min(displayArea.x + displayArea.width - contentSize.width,
                Math.max(displayArea.x, fromRect.x + (fromRect.width - contentSize.width) / 2)),
            fromRect.y - contentSize.height - arrowSize.height);
        let anchorPoint = new Point(fromRect.x + fromRect.width / 2.0, fromRect.y);

        return {
            popoverOrigin,
            anchorPoint,
            placement: 'top',
        }
    }
    computeBottomGeometry({ displayArea, fromRect, contentSize, arrowSize }) {
        let popoverOrigin = new Point(
            Math.min(displayArea.x + displayArea.width - contentSize.width,
                Math.max(displayArea.x, fromRect.x + (fromRect.width - contentSize.width) / 2)),
            fromRect.y + fromRect.height + arrowSize.height);
        let anchorPoint = new Point(fromRect.x + fromRect.width / 2.0, fromRect.y + fromRect.height);

        return {
            popoverOrigin,
            anchorPoint,
            placement: 'bottom',
        }
    }
    computeLeftGeometry({ displayArea, fromRect, contentSize, arrowSize }) {
        let popoverOrigin = new Point(fromRect.x - contentSize.width - arrowSize.width,
            Math.min(displayArea.y + displayArea.height - contentSize.height,
                Math.max(displayArea.y, fromRect.y + (fromRect.height - contentSize.height) / 2)));
        let anchorPoint = new Point(fromRect.x, fromRect.y + fromRect.height / 2.0);

        return {
            popoverOrigin,
            anchorPoint,
            placement: 'left',
        }
    }
    computeRightGeometry({ displayArea, fromRect, contentSize, arrowSize }) {
        let popoverOrigin = new Point(fromRect.x + fromRect.width + arrowSize.width,
            Math.min(displayArea.y + displayArea.height - contentSize.height,
                Math.max(displayArea.y, fromRect.y + (fromRect.height - contentSize.height) / 2)));
        let anchorPoint = new Point(fromRect.x + fromRect.width, fromRect.y + fromRect.height / 2.0);

        return {
            popoverOrigin,
            anchorPoint,
            placement: 'right',
        }
    }
    computeAutoGeometry({ displayArea, contentSize }) {
        let placementsToTry = ['left', 'right', 'bottom', 'top'];
        let placement = placementsToTry[0];
        for (let i = 0; i < placementsToTry.length; i++) {
            placement = placementsToTry[i];
            var geom = this.computeGeometry({
                contentSize: contentSize,
                placement: placement
            }).geom;
            let { popoverOrigin } = geom;

            if (
                popoverOrigin.x >= displayArea.x &&
                popoverOrigin.x <=
                displayArea.x + displayArea.width - contentSize.width &&
                popoverOrigin.y >= displayArea.y &&
                popoverOrigin.y <=
                displayArea.y + displayArea.height - contentSize.height
            ) {
                break;
            }
        }

        // return geom;
        return { placement, geom };
    }
    getArrowSize(placement) {
        let size = this.props.arrowSize;
        switch (placement) {
        case 'left':
        case 'right':
            return new Size(size.height, size.width);
        default:
            return size;
        }
    }
    getArrowColorStyle(color) {
        return { borderTopColor: color };
    }
    getArrowRotation(placement) {
        switch (placement) {
        case 'bottom':
            return '180deg';
        case 'left':
            return '-90deg';
        case 'right':
            return '90deg';
        default:
            return '0deg';
        }
    }
    getArrowDynamicStyle(placement) {
        let { anchorPoint, popoverOrigin } = this.state;
        let arrowSize = this.props.arrowSize;

        // Create the arrow from a rectangle with the appropriate borderXWidth set
        // A rotation is then applied dependending on the placement
        // Also make it slightly bigger
        // to fix a visual artifact when the popover is animated with a scale
        let width = arrowSize.width + 2;
        let height = arrowSize.height * 2 + 2;
        let marginTop = 0.0;
        let marginLeft = 0.0;
        // Add a margin and only for bottom and right because it will drawn outside the display area otherwise
        if (placement == "bottom") {
            marginTop = arrowSize.height;
        } else if (placement == "right") {
            marginLeft = arrowSize.width;
        }
        return {
            left: anchorPoint.x - popoverOrigin.x - width / 2 + marginLeft,
            top: anchorPoint.y - popoverOrigin.y - height / 2 + marginTop,
            width: width,
            height: height,
            borderTopWidth: height / 2,
            borderRightWidth: width / 2,
            borderBottomWidth: height / 2,
            borderLeftWidth: width / 2,
        }
    }
    getTranslateOrigin() {
        let { contentSize, popoverOrigin, anchorPoint } = this.state;
        let popoverCenter = new Point(popoverOrigin.x + contentSize.width / 2,
            popoverOrigin.y + contentSize.height / 2);
        return new Point(anchorPoint.x - popoverCenter.x, anchorPoint.y - popoverCenter.y);
    }
    componentWillReceiveProps(nextProps) {
        let willBeVisible = nextProps.isVisible;
        let {
            isVisible,
        } = this.props;

        if (willBeVisible !== isVisible) {
            if (willBeVisible) {
                this.setState({ contentSize: {}, isAwaitingShow: true });
            } else {
                this._startAnimation({ show: false });
            }
        }
    }
    _startAnimation({ show }) {
        let handler = this.props.startCustomAnimation || this._startDefaultAnimation;
        handler.call(this, { show, doneCallback: () => this.setState({ isTransitioning: false }) })
        this.setState({ isTransitioning: true });
    }
    _startDefaultAnimation({ show, doneCallback }) {
        let animDuration = 300;
        let values = this.state.defaultAnimatedValues;
        let translateOrigin = this.getTranslateOrigin();

        if (show) {
            values.translate.setValue(translateOrigin);
        }

        let commonConfig = {
            duration: animDuration,
            easing: show ? Easing.out(Easing.back()) : Easing.inOut(Easing.quad),
        }

        Animated.parallel([
            Animated.timing(values.fade, {
                toValue: show ? 1 : 0,
                ...commonConfig,
            }),
            Animated.timing(values.translate, {
                toValue: show ? new Point(0, 0) : translateOrigin,
                ...commonConfig,
            }),
            Animated.timing(values.scale, {
                toValue: show ? 1 : 0,
                ...commonConfig,
            })
        ]).start(doneCallback);
    }
    _getDefaultAnimatedStyles() {
        // If there's a custom animation handler,
        // we don't return the default animated styles
        if (typeof this.props.startCustomAnimation !== 'undefined') {
            return null;
        }

        let animatedValues = this.state.defaultAnimatedValues;
        return {
            backgroundStyle: {
                opacity: animatedValues.fade,
            },
            arrowStyle: {
                transform: [
                    {
                        scale: animatedValues.scale.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                            extrapolate: 'clamp',
                        }),
                    }
                ],
            },
            contentStyle: {
                transform: [
                    { translateX: animatedValues.translate.x },
                    { translateY: animatedValues.translate.y },
                    { scale: animatedValues.scale },
                ],
            }
        };
    }
    _getExtendedStyles() {
        let background = [];
        let popover = [];
        let arrow = [];
        let content = [];

        [this._getDefaultAnimatedStyles(), this.props].forEach((source) => {
            if (source) {
                background.push(source.backgroundStyle);
                popover.push(source.popoverStyle);
                arrow.push(source.arrowStyle);
                content.push(source.contentStyle);
            }
        });

        return {
            background,
            popover,
            arrow,
            content,
        }
    }
    render() {
        if (!this.props.isVisible && !this.state.isTransitioning) {
            return null;
        }

        let { popoverOrigin, placement } = this.state;
        let extendedStyles = this._getExtendedStyles();
        let contentStyle = [styles.content, ...extendedStyles.content];
        let arrowColor = StyleSheet.flatten(contentStyle).backgroundColor;
        let arrowColorStyle = this.getArrowColorStyle(arrowColor);
        let arrowDynamicStyle = this.getArrowDynamicStyle(placement);
        let contentSizeAvailable = this.state.contentSize.width;

        // Special case, force the arrow rotation even if it was overriden
        let arrowStyle = [styles.arrow, arrowDynamicStyle, arrowColorStyle, ...extendedStyles.arrow];
        let arrowTransform = (StyleSheet.flatten(arrowStyle).transform || []).slice(0);
        arrowTransform.unshift({ rotate: this.getArrowRotation(placement) });
        arrowStyle = [...arrowStyle, { transform: arrowTransform }];
        let extraRoomForArrow = {};
        if (placement == "bottom") {
            extraRoomForArrow = { paddingTop: this.props.arrowSize.height };
        } else if (placement == "top") {
            extraRoomForArrow = { paddingBottom: this.props.arrowSize.height };
        } else if (placement == "right") {
            extraRoomForArrow = { paddingLeft: this.props.arrowSize.height };
        } else if (placement == "left") {
            extraRoomForArrow = { paddingRight: this.props.arrowSize.height };
        }
        return (
            <TouchableWithoutFeedback onPress={this.props.onClose}>
                <View style={[contentSizeAvailable && styles.containerVisible, styles.container]}>
                    <Animated.View style={[styles.popover, {
                        top: popoverOrigin.y - 60,
                        left: popoverOrigin.x,
                    }, ...extendedStyles.popover, extraRoomForArrow]}>
                        <Animated.View style={arrowStyle} />
                        <Animated.View ref='content' onLayout={(e) => this.measureContent(e)} style={contentStyle}>
                            {this.props.children}
                        </Animated.View>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        );
    }
};


var styles = StyleSheet.create({
    containerVisible: {
        opacity: 1,
    },
    container: {
        opacity: 1,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        position: 'absolute',
        backgroundColor: 'transparent',
    },
    popover: {
        backgroundColor: 'transparent',
        position: 'absolute',
        /*shadowColor: 'black',
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 2,
        shadowOpacity: 0.8,*/
    },
    content: {
        borderRadius: 5,
        padding: 7,
        width: px(140),
        height: px(65),
        backgroundColor: '#000',
    },
    arrow: {
        position: 'absolute',
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
});

module.exports = Popover;
