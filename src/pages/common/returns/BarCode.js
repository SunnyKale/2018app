import React, {
    Component,
} from 'react'
import {
    View,
    StyleSheet,
    Alert,
} from 'react-native'

import Barcode from 'react-native-smart-barcode'

export default class BarcodeTest extends Component {

    // 构造
    constructor(props) {
        super(props);
        // 初始状态
        this.state = {
            viewAppear: false,
        };
    }

    render() {

        return (
            <View style={{flex: 1, backgroundColor: 'black'}}>
                {this.state.viewAppear ?
                    <Barcode
                        style={{flex: 1}}
                        ref={component => this._barCode = component}
                        onBarCodeRead={this._onBarCodeRead}/> : null}
            </View>
        )
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    _onBarCodeRead = (e) => {
        //console.log(`e.nativeEvent.data.type = ${e.nativeEvent.data.type}, e.nativeEvent.data.code = ${e.nativeEvent.data.code}`)
        this._stopScan()
        Alert.alert(e.nativeEvent.data.type, e.nativeEvent.data.code, [
            {text: 'OK', onPress: () => this._startScan()},
        ])
    }

    open() {
        this.setState({
            viewAppear: true
        })
    }

    close() {
        this.setState({
            viewAppear: false
        })
    }

    _startScan = (e) => {
        this._barCode.startScan()
    }

    _stopScan = (e) => {
        this._barCode.stopScan()
    }
}