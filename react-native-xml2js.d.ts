// filepath: c:\Users\Loocj\Desktop\AwesomeProject\react-native-xml2js.d.ts
declare module 'react-native-xml2js' {
  export function parseString(xml: string, callback: (err: any, result: any) => void): void;
  export function parseString(xml: string, options: any, callback: (err: any, result: any) => void): void;
  // You can add more specific types for options and result if you know them
  // or if you want to improve type safety.
  // For a quick fix to just remove the error, the following is also sufficient:
  // const value: any;
  // export default value;
}
