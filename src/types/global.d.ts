declare module '*.scss';
declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';

interface Window {
  requestIdleCallback?: (cb: Function) => number;
  cancelIdleCallback?: (id: number) => void;
}

// Temporary globals referenced in some legacy files — declare loosely to satisfy TS.
declare const wantsSecurityLayer: any;
declare const LOCKED_PLACEHOLDER_IMG: string | any;
declare const hidePreviewOnBoard: any;
declare const imgUrl: any;
