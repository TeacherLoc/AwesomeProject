import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const Calculator = () => {
  const [theme, setTheme] = useState('light');
  const [currentNumber, setCurrentNumber] = useState('');
  const [previousNumber, setPreviousNumber] = useState('');
  const [operation, setOperation] = useState(null);
  const [displayValue, setDisplayValue] = useState('0');
  const [expression, setExpression] = useState('');

  const themes = {
    light: {
      background: '#f0f0f0',
      displayBackground: '#ffffff',
      displayColor: '#000000',
      expressionColor: '#888888',
      buttonBackground: '#ffffff',
      buttonColor: '#000000',
      operatorButtonBackground: '#4db6ac',
      operatorButtonColor: '#ffffff',
      specialButtonBackground: '#e0e0e0',
      specialButtonColor: '#000000',
      themeIconColor: '#000000',
    },
    dark: {
      background: '#121212',
      displayBackground: '#1e1e1e',
      displayColor: '#ffffff',
      expressionColor: '#aaaaaa',
      buttonBackground: '#333333',
      buttonColor: '#ffffff',
      operatorButtonBackground: '#00897b',
      operatorButtonColor: '#ffffff',
      specialButtonBackground: '#555555',
      specialButtonColor: '#ffffff',
      themeIconColor: '#ffffff',
    },
  };

  const styles = getStyles(themes[theme]);

  const handleNumberPress = value => {
    if (currentNumber.length >= 10) return;
    if (value === '.' && currentNumber.includes('.')) return;
    if (currentNumber === '0' && value !== '.') {
      setCurrentNumber(value);
      setDisplayValue(value);
    } else {
      const newNum = currentNumber + value;
      setCurrentNumber(newNum);
      setDisplayValue(newNum);
    }
  };

  const handleOperationPress = op => {
    if (currentNumber === '' && previousNumber === '') return;

    if (previousNumber !== '' && currentNumber !== '' && operation) {
      calculateResult();
      setPreviousNumber(currentNumber);
      setOperation(op);
      setExpression(`${currentNumber} ${op}`);
      setCurrentNumber('');
    } else if (currentNumber !== '') {
      setPreviousNumber(currentNumber);
      setOperation(op);
      setExpression(`${currentNumber} ${op}`);
      setCurrentNumber('');
      setDisplayValue(currentNumber);
    } else if (previousNumber !== '') {
      setOperation(op);
      setExpression(`${previousNumber} ${op}`);
    }
  };

  const calculateResult = () => {
    if (previousNumber === '' || currentNumber === '' || !operation) return;

    const prev = parseFloat(previousNumber);
    const curr = parseFloat(currentNumber);
    let result;

    switch (operation) {
      case '+':
        result = prev + curr;
        break;
      case '-':
        result = prev - curr;
        break;
      case '*':
        result = prev * curr;
        break;
      case '/':
        if (curr === 0) {
          result = 'Error';
        } else {
          result = prev / curr;
        }
        break;
      default:
        return;
    }

    const resultString =
      result === 'Error' ? 'Error' : String(parseFloat(result.toFixed(6)));
    setDisplayValue(resultString);
    setExpression(`${previousNumber} ${operation} ${currentNumber} =`);
    setCurrentNumber(resultString === 'Error' ? '' : resultString);
    setPreviousNumber('');
    setOperation(null);
  };

  const handleClearPress = () => {
    setCurrentNumber('');
    setPreviousNumber('');
    setOperation(null);
    setDisplayValue('0');
    setExpression('');
  };

  const handleDeletePress = () => {
    if (currentNumber === '' || currentNumber === 'Error') return;
    const newNum = currentNumber.slice(0, -1);
    setCurrentNumber(newNum);
    setDisplayValue(newNum === '' ? '0' : newNum);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const renderButton = (value, type = 'number', flex = 1) => {
    let buttonStyle = styles.button;
    let textStyle = styles.buttonText;

    if (type === 'operator') {
      buttonStyle = styles.operatorButton;
      textStyle = styles.operatorButtonText;
    } else if (type === 'special') {
      buttonStyle = styles.specialButton;
      textStyle = styles.specialButtonText;
    }

    let onPressAction;
    switch (value) {
      case 'C':
        onPressAction = handleClearPress;
        break;
      case 'DEL':
        onPressAction = handleDeletePress;
        break;
      case '=':
        onPressAction = calculateResult;
        break;
      case '+':
      case '-':
      case '*':
      case '/':
        onPressAction = () => handleOperationPress(value);
        break;
      default:
        onPressAction = () => handleNumberPress(value);
        break;
    }

    return (
      <TouchableOpacity style={[buttonStyle, {flex}]} onPress={onPressAction}>
        <Text style={textStyle}>{value}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.displayContainer}>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <FontAwesome6
            name={theme === 'light' ? 'moon' : 'sun'}
            size={24}
            color={styles.themeIcon.color}
            solid
          />
        </TouchableOpacity>
        <Text style={styles.expressionText}>{expression}</Text>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {displayValue}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {renderButton('C', 'special')}
          {renderButton('DEL', 'special')}
          {renderButton('/', 'operator')}
        </View>
        {/* Row 2 */}
        <View style={styles.row}>
          {renderButton('7')}
          {renderButton('8')}
          {renderButton('9')}
          {renderButton('*', 'operator')}
        </View>
        {/* Row 3 */}
        <View style={styles.row}>
          {renderButton('4')}
          {renderButton('5')}
          {renderButton('6')}
          {renderButton('-', 'operator')}
        </View>
        {/* Row 4 */}
        <View style={styles.row}>
          {renderButton('1')}
          {renderButton('2')}
          {renderButton('3')}
          {renderButton('+', 'operator')}
        </View>
        {/* Row 5 */}
        <View style={styles.row}>
          {renderButton('0', 'number', 2)}
          {renderButton('.')}
          {renderButton('=', 'operator')}
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    displayContainer: {
      flex: 2,
      backgroundColor: theme.displayBackground,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      padding: 20,
      position: 'relative',
    },
    themeButton: {
      position: 'absolute',
      top: 15,
      left: 15,
      padding: 10,
    },
    themeIcon: {
      color: theme.themeIconColor,
    },
    expressionText: {
      fontSize: 18,
      color: theme.expressionColor,
      marginBottom: 5,
    },
    displayText: {
      fontSize: 50,
      color: theme.displayColor,
    },
    buttonContainer: {
      flex: 3,
      padding: 5,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    button: {
      flex: 1,
      backgroundColor: theme.buttonBackground,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 5,
      borderRadius: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 1,
    },
    buttonText: {
      fontSize: 24,
      color: theme.buttonColor,
    },
    operatorButton: {
      flex: 1,
      backgroundColor: theme.operatorButtonBackground,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 5,
      borderRadius: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 1,
    },
    operatorButtonText: {
      fontSize: 24,
      color: theme.operatorButtonColor,
    },
    specialButton: {
      flex: 1,
      backgroundColor: theme.specialButtonBackground,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 5,
      borderRadius: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 1,
    },
    specialButtonText: {
      fontSize: 24,
      color: theme.specialButtonColor,
    },
  });

export default Calculator;