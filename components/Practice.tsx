import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';


export default function practice() {
  return (
      <View style={styles.background}>
        <Text>
            Loc la ai vay
        </Text>
      </View>
  );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
      },
});

