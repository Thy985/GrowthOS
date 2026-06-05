/// <reference types="vite/client" />

// CSS side-effect imports
declare module '*.css';

// 测试环境下 process 全局变量
declare const process: { env: { [key: string]: string | undefined } };
