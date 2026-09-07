import assert from "node:assert/strict";
import { createStore } from "./store.js";
import { createAppModule } from "./modules/app.js";

const store = createStore({ count: 0 });
store.setState({ count: 1 });
assert.equal(store.getState().count, 1);

const app = createAppModule();
app.boot("demo");
assert.equal(app.store.getState().status, "ready");
