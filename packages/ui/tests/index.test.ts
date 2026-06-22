import { expect, test } from "vite-plus/test";
import { Button, cx } from "../src/index.ts";

test("exports Button component", () => {
  expect(Button).toBeTypeOf("function");
});

test("cx merges tailwind classes", () => {
  expect(cx("px-2 px-4")).toBe("px-4");
});
