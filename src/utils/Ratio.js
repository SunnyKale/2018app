
import {
    Dimensions,
    Platform,
    PixelRatio,
    StyleSheet
} from 'react-native';
import { getHeader } from '../services/Request'

const dimen = Dimensions.get('window');
export const deviceWidth = dimen.width;
export const deviceHeight = dimen.height;
export const deviceHeightHalf = dimen.height / 2;
export const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;
export const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 + STATUS_BAR_HEIGHT : 56 + STATUS_BAR_HEIGHT;

export const pxRatio = PixelRatio.get();  // 屏幕像密度
export const px1 = 1 / pxRatio;
export function px(size) {
    if (size == 1) {
        return StyleSheet.hairlineWidth;
    }

    return Math.round(deviceWidth / 750 * size);
}
export function getSize(size) {
    if (PixelRatio.get() >= 3 && Platform.OS == 'ios' && size == 1) {
        return size;
    }
    return 750 / deviceWidth * size;
}

let _isIphoneX = null;
export function isIphoneX() {
    if (_isIphoneX !== null) return _isIphoneX;
    if (Platform.OS !== 'ios') {
        _isIphoneX = false;
        return _isIphoneX;
    }
    _isIphoneX = !Platform.isPad &&
        !Platform.isTVOS &&
        (dimen.height === 812 || dimen.width === 812 || dimen.height === 896 || dimen.width === 896);
    return _isIphoneX;
}
export function isIphone() {
    return Platform.OS === "ios";
}

export function setHeight() {
    if (Platform.OS === 'ios' && PixelRatio.get() >= 3) {
        return px(495);
    } else if (Platform.OS === 'ios' && deviceWidth <= 320) { // 适配 小屏(4/4s/5/5s)
        return px(515)
    } else if (Platform.OS === 'android' && deviceWidth <= 360) {  // 适配 android 小屏
        return px(500);
    } else {
        return px(495);
    }
}