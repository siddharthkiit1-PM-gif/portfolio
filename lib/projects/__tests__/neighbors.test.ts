import { describe, expect, it } from "vitest";
import { neighbors } from "../neighbors";

type Row = { slug: string; title: string };

const ROWS: Row[] = [
  { slug: "a", title: "A" },
  { slug: "b", title: "B" },
  { slug: "c", title: "C" },
];

describe("neighbors", () => {
  it("returns the previous and next rows wrapping at the boundaries", () => {
    expect(neighbors(ROWS, "a")).toEqual({ prev: ROWS[2], next: ROWS[1] });
    expect(neighbors(ROWS, "b")).toEqual({ prev: ROWS[0], next: ROWS[2] });
    expect(neighbors(ROWS, "c")).toEqual({ prev: ROWS[1], next: ROWS[0] });
  });

  it("returns prev=next=null when the slug is not in the list", () => {
    expect(neighbors(ROWS, "missing")).toEqual({ prev: null, next: null });
  });

  it("returns prev=next=null on a single-row list (no wrap-to-self)", () => {
    expect(neighbors([ROWS[0]], "a")).toEqual({ prev: null, next: null });
  });

  it("returns prev=next=null on an empty list", () => {
    expect(neighbors<Row>([], "a")).toEqual({ prev: null, next: null });
  });
});
