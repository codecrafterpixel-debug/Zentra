const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function createLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

function loadStorageModule() {
  const storagePath = path.join(__dirname, "..", "js", "storage.js");
  const source = fs.readFileSync(storagePath, "utf8");
  const context = {
    console,
    localStorage: createLocalStorage(),
    window: {
      dispatchEvent() {},
      addEventListener() {},
    },
    document: {},
    Auth: {
      getSession() {
        return null;
      },
    },
  };
  context.global = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: storagePath });
  const Storage = vm.runInContext("Storage", context);
  return { context, Storage };
}

function run() {
  const { context, Storage } = loadStorageModule();

  context.Auth.getSession = () => ({ role: "user" });
  assert.strictEqual(
    Storage.addProduct({ name: "Guest Product" }),
    null,
    "non-admin should not be able to add products",
  );

  context.Auth.getSession = () => ({ role: "admin" });
  const created = Storage.addProduct({
    name: "Admin Product",
    price: 499,
    category: "graphic",
  });
  assert.ok(created, "admin should be able to add products");
  assert.strictEqual(created.name, "Admin Product");
  assert.ok(created.id, "new product should get an id");

  const updated = Storage.updateProduct(created.id, { price: 599 });
  assert.ok(updated, "admin should be able to update products");
  assert.strictEqual(updated.price, 599);

  const deleted = Storage.deleteProduct(created.id);
  assert.strictEqual(deleted, true, "admin should be able to delete products");
  console.log("storage tests passed");
}

run();
