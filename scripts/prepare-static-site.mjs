import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const outputDirectory = resolve(root, ".static-build");
const clientDirectory = resolve(root, "dist/client");
const prerenderDirectory = resolve(root, "dist/server/prerendered-routes");

async function prepareStaticSite() {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  await cp(clientDirectory, outputDirectory, { recursive: true });
  await cp(resolve(prerenderDirectory, "index.html"), resolve(outputDirectory, "index.html"));
  await cp(resolve(prerenderDirectory, "404.html"), resolve(outputDirectory, "404.html"));
}

prepareStaticSite().catch((error) => {
  console.error("정적 사이트 파일을 준비하지 못했습니다.", error);
  process.exitCode = 1;
});
