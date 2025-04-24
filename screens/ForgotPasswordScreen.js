import React from 'react';
import ForgotPassword from '../components/ForgotPassword';

const ForgotPasswordScreen = ({ navigation }) => {
  return <ForgotPassword setIsForgotPassword={() => navigation.goBack()} />;
};

export default ForgotPasswordScreen;