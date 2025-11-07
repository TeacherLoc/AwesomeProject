/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const noop = () => {};
  const mockAnimatedValue = { value: 0 };

  return {
    __esModule: true,
    default: {
      addWhitelistedNativeProps: noop,
      createAnimatedComponent: component => component,
      Value: function Value() {
        return mockAnimatedValue;
      },
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedGestureHandler: jest.fn(() => ({})),
    withTiming: jest.fn(value => value),
    withSpring: jest.fn(value => value),
    withRepeat: jest.fn(value => value),
    Easing: {
      linear: jest.fn(),
    },
    cancelAnimation: jest.fn(),
    runOnJS: jest.fn(fn => fn),
    runOnUI: jest.fn(fn => fn),
  };
});

jest.mock('@react-native-firebase/auth', () => {
  const mockAuthInstance = {
    currentUser: null,
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockAuthInstance),
    getAuth: jest.fn(() => mockAuthInstance),
    onAuthStateChanged: jest.fn((_auth, callback) => {
      if (typeof callback === 'function') {
        callback(null);
      }
      return jest.fn();
    }),
  };
});

jest.mock('@react-native-firebase/firestore', () => {
  const createDocRef = () => ({
    get: jest.fn().mockResolvedValue({ exists: false, data: jest.fn() }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  });

  const createCollectionRef = () => ({
    doc: jest.fn(() => createDocRef()),
    where: jest.fn(() => createCollectionRef()),
    orderBy: jest.fn(() => createCollectionRef()),
    get: jest.fn().mockResolvedValue({ docs: [], empty: true }),
    add: jest.fn().mockResolvedValue({}),
  });

  const firestore = jest.fn(() => ({
    collection: jest.fn(() => createCollectionRef()),
    doc: jest.fn(() => createDocRef()),
  }));

  firestore.Timestamp = {
    fromDate: date => ({ toDate: () => date }),
    now: () => ({ toDate: () => new Date() }),
  };

  firestore.FieldValue = {
    serverTimestamp: jest.fn(),
  };

  return {
    __esModule: true,
    default: firestore,
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({}),
    signOut: jest.fn().mockResolvedValue(undefined),
    isSignedIn: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('@react-native-firebase/app', () => {
  const mockApp = {
    name: 'mock-app',
    options: {},
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockApp),
    getApp: jest.fn(() => mockApp),
    apps: [mockApp],
  };
});

jest.mock('react-native-date-picker', () => 'DatePicker');

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn((_options, callback) => {
    if (typeof callback === 'function') {
      callback({ didCancel: true });
    }
  }),
}));

jest.mock('@react-native-ml-kit/text-recognition', () => ({
  recognize: jest.fn().mockResolvedValue({ text: '' }),
}));

jest.mock('react-native-keyboard-controller', () => ({
  useKeyboardController: jest.fn(() => ({ keyboardHeight: 0, dismiss: jest.fn() })),
  KeyboardController: {
    dismiss: jest.fn(),
    setDefaultMode: jest.fn(),
  },
}));
