import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicProducts, mapApiProduct } from '../../src/api/products.js';

afterEach(() => vi.unstubAllGlobals());

describe('storefront product API adapter', () => {
  it('maps paise, condition, and backend-hosted images into storefront products', () => {
    const product = mapApiProduct({ id: 'abc123', title: 'Cotton shirt', description: 'A comfortable shirt.', category: 'tops', size: 'm', condition: 'very_good', pricePaise: 12550, imageUrls: ['/api/v1/uploads/11111111-1111-4111-8111-111111111111.jpg'] });
    expect(product).toMatchObject({ id: 'abc123', price: 125.5, category: 'tops', size: 'M', condition: 'Very Good', brand: 'GOSH Seller' });
    expect(product.image).toBe('http://localhost:4000/api/v1/uploads/11111111-1111-4111-8111-111111111111.jpg');
  });

  it('uses credentialed requests and retrieves all API pages', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ products: [apiProduct('one')], pages: 2 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ products: [apiProduct('two')] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const products = await getPublicProducts();
    expect(products.map((item) => item.id)).toEqual(['one', 'two']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((call) => call[1]?.credentials)).toEqual(['include', 'include']);
  });
});

function apiProduct(id: string) { return { id, title: 'Cotton shirt', description: 'A comfortable shirt.', category: 'tops', size: 'M', condition: 'excellent', pricePaise: 10000, imageUrls: [] }; }
