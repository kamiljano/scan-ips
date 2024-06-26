import { describe, test, beforeAll, expect, afterEach } from "vitest";
import SqliteStore from "../../src/store/sqlite-store";

describe("sqlite-store", () => {
  const store = new SqliteStore(":memory:");

  beforeAll(async () => {
    await store.init();
  });

  afterEach(async () => {
    await store.clear();
  });

  test("iterateUrls", async () => {
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < 1100; i++) {
      promises.push(store.store(`http://example${i}.com`));
    }
    await Promise.all(promises);

    let results = 0;
    for await (const url of store.iterateUrls()) {
      results++;
    }

    expect(results).toEqual(1100);
  });

  test("new record should be created", async () => {
    await store.store({
      url: "http://example.com",
      source: "testSource",
      meta: {
        key: "value",
      },
    });

    const result = await store.list();

    expect(result).toEqual([
      {
        id: expect.any(Number),
        url: "http://example.com",
        meta: {
          testSource: {
            key: "value",
          },
        },
      },
    ]);
  });

  test("the old value should be updated", async () => {
    await store.store({
      url: "http://example.com",
      source: "testSource",
      meta: {
        key: "value",
      },
    });

    await store.store({
      url: "http://example.com",
      source: "testSource",
      meta: {
        key: "value2",
      },
    });

    const result = await store.list();

    expect(result).toEqual([
      {
        id: expect.any(Number),
        url: "http://example.com",
        meta: {
          testSource: {
            key: "value2",
          },
        },
      },
    ]);
  });

  test("the record should be updated", async () => {
    await Promise.all([
      store.store({
        url: "http://example.com",
        source: "testSource1",
        meta: {
          key: "value",
        },
      }),
      store.store({
        url: "http://example.com",
        source: "testSource2",
        meta: {
          key: "value",
        },
      }),
    ]);

    const result = await store.list();

    expect(result).toEqual([
      {
        id: expect.any(Number),
        url: "http://example.com",
        meta: {
          testSource1: {
            key: "value",
          },
          testSource2: {
            key: "value",
          },
        },
      },
    ]);
  });
});
