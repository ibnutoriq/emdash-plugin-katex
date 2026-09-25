// @vitest-environment node
import { expect, it } from "vitest";

it("scan() is a no-op without a DOM (SSR, or a timer firing after the page is gone)", async () => {
  const { scan } = await import("../src/admin");
  expect(() => scan()).not.toThrow();
});
