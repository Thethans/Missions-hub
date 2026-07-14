// Ambient module declarations for Vite's static asset imports (Vite resolves
// these to a URL string at build time). The repo has no global vite/client
// types set up, so this is scoped to the prayer-map feature via tsconfig's
// `include`.
declare module '*.jpg' {
  const src: string;
  export default src;
}
