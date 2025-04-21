import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import Project1 from './lab1/Projrct1';
import Project2 from './lab1/Project2';
import Project3 from './lab1/Project3';
import Project4 from './lab1/Project4';
import Project5 from './lab1/Project5';
import Project6 from './lab1/Project6';
import Project7 from './lab1/Project7';
import Project8 from './lab1/Project8';

const App = () => {
  const [currentProject, setCurrentProject] = useState('Home');

  const renderProject = () => {
    switch (currentProject) {
      case 'Project1':
        return (
          <View style={styles.projectContainer}>
            <Project1 />
            <Button title="Back to Home" onPress={() => setCurrentProject('Home')} />
          </View>
        );
      case 'Project2':
        return (
          <View style={styles.projectContainer}>
            <Project2 />
            <Button title="Back to Home" onPress={() => setCurrentProject('Home')} />
          </View>
        );
      case 'Project3':
        return (
          <View style={styles.projectContainer}>
            <Project3 />
            <Button title="Back to Home" onPress={() => setCurrentProject('Home')} />
          </View>
        );
      case 'Project4':
        return (
          <View style={styles.projectContainer}>
            <Project4 />
            <Button title="Back to Home" onPress={() => setCurrentProject('Home')} />
          </View>
        );
      case 'Project5':
        return (
          <View style={styles.projectContainer}>
            <Project5 />
            <Button title="Back to Home" onPress={() => setCurrentProject('Home')} />
          </View>
        );
      case 'Project6':
        return (
          <View style={styles.projectContainer}>
            <Project6 />
            <Button title="Trờ về trang chủ" onPress={() => setCurrentProject('Home')} />
          </View>
        );
      case 'Project7':
        return (
          <View style={styles.projectContainer}>
            <Project7 />
            <Button title="Trờ về trang chủ" onPress={() => setCurrentProject('Home')} />
          </View>
        );
      case 'Project8':
        return (
          <View style={styles.projectContainer}>
            <Project8 />
            <Button title="Trờ về trang chủ" onPress={() => setCurrentProject('Home')} />
          </View>
        );
      default:
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Lựa chọn Project của bạn</Text>
            <TouchableOpacity
              style={[styles.projectButton, styles.project1Button]}
              onPress={() => setCurrentProject('Project1')}
            >
              <Text style={styles.buttonText}>Lựa chọn Project 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.projectButton, styles.project2Button]}
              onPress={() => setCurrentProject('Project2')}
            >
              <Text style={styles.buttonText}>Lựa chọn Project 2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.projectButton, styles.project3Button]}
              onPress={() => setCurrentProject('Project3')}
            >
              <Text style={styles.buttonText}>Lựa chọn Project 3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.projectButton, styles.project4Button]}
              onPress={() => setCurrentProject('Project4')}
            >
              <Text style={styles.buttonText}>Lựa chọn Project 4</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.projectButton, styles.project5Button]}
              onPress={() => setCurrentProject('Project5')}
            >
              <Text style={styles.buttonText}>Lựa chọn Project 5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.projectButton, styles.project6Button]}
              onPress={() => setCurrentProject('Project6')}
            >
              <Text style={styles.buttonText}>Lựa chọn Project 6</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.projectButton, styles.project7Button]}
              onPress={() => setCurrentProject('Project7')}
            >
              <Text style={styles.buttonText}>Lựa chọn Project 7</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.projectButton, styles.project8Button]}
              onPress={() => setCurrentProject('Project8')}
            >
              <Text style={styles.buttonText}>Lựa chọn Project 8</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <ImageBackground
      source={require('./assets/anhdep.png')}
      style={styles.background}
    >
      {renderProject()}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  projectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
    padding: 10,
  },
  projectButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  project1Button: {
    backgroundColor: '#FF5733',
  },
  project2Button: {
    backgroundColor: 'red',
  },
  project3Button: {
    backgroundColor: 'blue',
  },
  project4Button: {
    backgroundColor: 'green',
  },
  project5Button: {
    backgroundColor: 'purple',
  },
  project6Button: {
    backgroundColor: 'orange',
  },
  project7Button: {
    backgroundColor: 'teal',
  },
  project8Button: {
    backgroundColor: 'pink',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;