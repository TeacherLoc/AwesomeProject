import React from 'react';
import {StyleSheet, View, Text} from 'react-native';

const Project5= () => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* H 1 */}
        <View style={[styles.box, styles.box1]}>
          <Text style={styles.text}>Square 1</Text>
        </View>

        {/* H 2 */}
        <View style={[styles.box, styles.box2]}>
          <Text style={styles.text}>Square 2</Text>
        </View>

        {/* H 3 */}
        <View style={[styles.box, styles.box3]}>
          <Text style={styles.text}>Square 3</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  box: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 10,
  },
  box1: {
    backgroundColor: '#87CEEB',
  },
  box2: {
    backgroundColor: '#48D1CC',
  },
  box3: {
    backgroundColor: '#F08080',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Project5;