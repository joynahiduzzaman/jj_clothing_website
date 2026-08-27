// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "../cart-store";

const sampleItem = {
  productId: "prod_1",
  variantId: "variant_1",
  name: "Oversized Cotton T-Shirt",
  slug: "oversized-cotton-tshirt",
  image: "https://example.com/img.jpg",
  price: 1000,
  quantity: 1,
  stock: 10,
  color: "Black",
  size: "M",
};

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("useCartStore", () => {
  it("adds a new item to an empty cart", () => {
    useCartStore.getState().addItem(sampleItem);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("increments quantity when adding the same variant again", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().addItem({ ...sampleItem, quantity: 2 });
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("keeps two different variants of the same product as separate lines", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().addItem({ ...sampleItem, variantId: "variant_2", size: "L" });
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("never lets quantity exceed available stock", () => {
    useCartStore.getState().addItem({ ...sampleItem, stock: 5, quantity: 3 });
    useCartStore.getState().addItem({ ...sampleItem, stock: 5, quantity: 10 });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("removes an item by productId + variantId", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().removeItem(sampleItem.productId, sampleItem.variantId);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("updateQuantity clamps between 1 and stock", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().updateQuantity(sampleItem.productId, sampleItem.variantId, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    useCartStore.getState().updateQuantity(sampleItem.productId, sampleItem.variantId, 999);
    expect(useCartStore.getState().items[0].quantity).toBe(sampleItem.stock);
  });

  it("subtotal() sums price × quantity across all items", () => {
    useCartStore.getState().addItem({ ...sampleItem, productId: "a", variantId: "va", price: 500, quantity: 2 });
    useCartStore.getState().addItem({ ...sampleItem, productId: "b", variantId: "vb", price: 300, quantity: 1 });
    expect(useCartStore.getState().subtotal()).toBe(500 * 2 + 300 * 1);
  });

  it("totalItems() sums quantities across all items", () => {
    useCartStore.getState().addItem({ ...sampleItem, productId: "a", variantId: "va", quantity: 2 });
    useCartStore.getState().addItem({ ...sampleItem, productId: "b", variantId: "vb", quantity: 3 });
    expect(useCartStore.getState().totalItems()).toBe(5);
  });

  it("clear() empties the cart", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
