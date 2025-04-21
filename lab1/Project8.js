import React from 'react';
import {StyleSheet, View, Text, FlatList, SafeAreaView} from 'react-native';

const DATA = [
  {id: '1', name: 'Johan Renard'},
  {id: '2', name: 'Brand Van Meij'},
  {id: '3', name: 'Kasper Kivela'},
  {id: '4', name: 'Harley Martin'},
  {id: '5', name: 'Aapo Niemela'},
  {id: '6', name: 'Carol Williams'},
  {id: '7', name: 'Megan Brown'},
  {id: '8', name: 'Liam Smith'},
  {id: '9', name: 'Mauritz Musch'},
  {id: '10', name: 'Andrea Austin'},
  {id: '11', name: 'Murat Kutlay'},
  {id: '12', name: 'Nanneke Ermers'},
  {id: '13', name: 'Jayden Anderson'},
  {id: '14', name: 'Nejla Van Riet'},
  {id: '15', name: 'Heather Hudson'},
  {id: '16', name: 'Maria Wright'},
  {id: '17', name: 'Edelmira Nogueira'},
  {id: '18', name: 'Liam Smith'},
  {id: '19', name: 'Olivia Johnson'},
  {id: '20', name: 'Noah Williams'},
  {id: '21', name: 'Emma Brown'},
  {id: '22', name: 'Oliver Jones'},
  {id: '23', name: 'Ava Garcia'},
  {id: '24', name: 'Elijah Miller'},
  {id: '25', name: 'Sophia Davis'},
];

const Item = ({name}) => (
  <View style={styles.item}>
    <Text style={styles.name}>{name}</Text>
  </View>
);

const Separator = () => <View style={styles.separator} />;

const Project8 = () => {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={DATA}
        renderItem={({item}) => <Item name={item.name} />}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={Separator}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  item: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});

export default Project8;