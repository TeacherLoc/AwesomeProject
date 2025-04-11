import React, { useState } from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';

interface CatProps {
  name: string;
}

const Cat = (props: CatProps) => {
  const [isHungry, setIsHungry] = useState(true);

  return (
    <View style={styles.catContainer}>
      <Text style={styles.catText}>
        I am {props.name} the cat. I am {isHungry ? 'hungry' : 'full'}.
      </Text>
      <Button
        onPress={() => setIsHungry(!isHungry)}
        disabled={!isHungry}
        title={isHungry ? 'Pour me some milk, please!' : 'Thank you!'}
      />
    </View>
  );
};

const Cafe = () => {
  return (
    <View style={styles.cafeContainer}>
      <Cat name="Munkustrap" />
      <Cat name="Spot" />
    </View>
  );
};

const styles = StyleSheet.create({
  catContainer: {
    margin: 10,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    alignItems: 'center',
  },
  catText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  cafeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default Cafe;
