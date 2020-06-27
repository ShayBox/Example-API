#!/usr/bin/env -S denon run --allow-net --allow-read

import { Application, send } from "https://deno.land/x/oak/mod.ts";
import {
  renderFile,
  renderFileToString,
} from "https://deno.land/x/dejs/mod.ts";

const app = new Application();

app.use(async (context) => {
  const root = Deno.cwd() + "/static";
  const path = context.request.url.pathname.replace(/\/$/, "");

  if (Deno.statSync(root + path).isDirectory) {
    const filesIter = Deno.readDirSync(root + path);
    const filesArr = Array.from(filesIter);

    const index = filesArr.find((file) =>
      [
        "index.html",
        "index.htm",
        "home.html",
        "home.htm",
        "default.html",
        "default.htm",
        "placeholder.html",
        "placeholder.htm",
      ].includes(file.name.toLowerCase())
    );
    if (index) {
      context.response.redirect(`${path}/${index.name}`);
    } else {
      const tables = filesArr.map((dir) => {
        const file = Deno.statSync(`${root + path}/${dir.name}`);
        const params = {
          href: `${path}/${dir.name}`,
          name: dir.name,
          type: dir.isDirectory ? "Directory" : "File",
          size: file.size,
        };

        return renderFileToString(Deno.cwd() + "/tables.ejs", params);
      });
      const files = (await Promise.all(tables)).join("\n");
      const html = await renderFile(Deno.cwd() + "/index.ejs", { files });

      context.response.body = html;
    }
  } else {
    await send(context, context.request.url.pathname, {
      root: Deno.cwd() + "/static",
      index: "index.html",
    });
  }
});

app.addEventListener("error", (event) => console.error(event.error));
app.addEventListener("listen", ({ hostname, port }) => {
  console.log(`Listening on http://${hostname ?? "localhost"}:${port}`);
});

await app.listen({ port: 1337 });
