import { browser } from "#imports";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
browser.devtools.panels.create("Atlassian Forge", "icon/128.png", "devtools-panel.html");
