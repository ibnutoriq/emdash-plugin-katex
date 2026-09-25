// Lets plain `tsc` type-check imports of .astro files (Astro's own tooling handles them in sites).
declare module "*.astro" {
  const Component: (props: Record<string, unknown>) => unknown;
  export default Component;
}
