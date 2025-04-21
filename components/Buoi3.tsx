import { useState } from "react";
import { StyleSheet, View } from "react-native"
import { Text, useTheme, MD3DarkTheme, MD3LightTheme, Switch, Button } from "react-native-paper";
const Buoi3 = ()=>{

    const [isDarkMode , setIsDarkMode] = useState(false)
    const myTheme = (isDarkMode)? MD3DarkTheme : MD3LightTheme;

    return (
        <View style={{...myStyle.container}}>
            <Switch value={isDarkMode} onValueChange={ setIsDarkMode} />
            <View style={{...myStyle.box, backgroundColor: myTheme.colors.primary}}>
                <Text style={{...myStyle.text, color: myTheme.colors.onPrimary}}>
                    primary
                </Text>
            </View>
            <View style={{...myStyle.box, backgroundColor: myTheme.colors.secondary}}>
                <Text style={{...myStyle.text, color: myTheme.colors.onSecondary}}>
                    primary
                </Text>
            </View>
            <View style={{...myStyle.box, backgroundColor: myTheme.colors.error}}>
                <Text style={{...myStyle.text, color: myTheme.colors.onError}}>
                    primary
                </Text>
            </View>
            <Button icon="home" style={{...myStyle.text, backgroundColor: myTheme.colors.primary}}>
                click me
            </Button>
        </View>
    )
}

export default Buoi3;

const myStyle = StyleSheet.create({
    container: {
        flex:1,
        justifyContent: "center"
    },
    box:{
        padding: 10,
        margin: 10,
    }
    ,
    text:{
        alignSelf: "center"
    }
})

