declare module "react-syntax-highlighter" {
  import { ComponentType } from "react";
  export const PrismAsyncLight: ComponentType<{
    language: string;
    style: object;
    children: string;
    customStyle?: object;
    wrapLongLines?: boolean;
  }> & {
    registerLanguage: (lang: string, importer: () => void) => void;
  };
}

declare module "react-syntax-highlighter/dist/cjs/languages/prism/jsx" {
  const jsx: () => void;
  export default jsx;
}

declare module "react-syntax-highlighter/dist/cjs/languages/prism/typescript" {
  const typescript: () => void;
  export default typescript;
}

declare module "react-syntax-highlighter/dist/cjs/languages/prism/javascript" {
  const javascript: () => void;
  export default javascript;
}

declare module "react-syntax-highlighter/dist/cjs/languages/prism/css" {
  const css: () => void;
  export default css;
}

declare module "react-syntax-highlighter/dist/cjs/languages/prism/markup" {
  const html: () => void;
  export default html;
}

declare module "react-syntax-highlighter/dist/cjs/languages/prism/json" {
  const json: () => void;
  export default json;
}

declare module "react-syntax-highlighter/dist/cjs/languages/prism/bash" {
  const bash: () => void;
  export default bash;
}

declare module "react-syntax-highlighter/dist/cjs/styles/prism" {
  export const vscDarkPlus: object;
}