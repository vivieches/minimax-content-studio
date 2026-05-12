import "@testing-library/jest-dom";
import { afterAll, beforeAll } from "vitest";
import { mkdirSync, rmSync } from "fs";
import { join } from "path";

const testDataDir = join(process.cwd(), ".open-studio-test", `vitest-${process.pid}`);

process.env.OPEN_STUDIO_DATA_DIR = testDataDir;

beforeAll(() => {
  rmSync(testDataDir, { recursive: true, force: true });
  mkdirSync(testDataDir, { recursive: true });
});

afterAll(() => {
  rmSync(testDataDir, { recursive: true, force: true });
});
