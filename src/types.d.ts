declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.i18n.json' {
  const content: Record<string, Record<string, string>>;
  export default content;
}

declare module '*.json' {
  const content: Record<string, string>;
  export default content;
}

declare interface Config {
  time;
}
