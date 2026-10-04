/** Stable editorial & UI image URLs (Unsplash) — avoids expired third-party links */

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const editorialImages = {
  register: unsplash('photo-1483985988355-763728e1935b'),
  login: unsplash('photo-1469334031218-e382a71b716b'),
  aboutHero: unsplash('photo-1490481651871-ab68de25d43d'),
  aboutCraft: unsplash('photo-1558171813-90888bb64b9d'),
  aboutAtelier: unsplash('photo-1520006403909-838d6b92c22e'),
  shipping: unsplash('photo-1566576912321-d58ddd7a6088'),
  contact: unsplash('photo-1441986300917-64674bd600d8'),
  trackingMap: unsplash('photo-1524661135-423995f22d0b'),
};

export const productImages = {
  cashmereSweater: unsplash('photo-1583743814966-8936f5b7be1a', 800),
  linenBlazer: unsplash('photo-1591369822096-ffd140ec948f', 800),
  cottonTee: unsplash('photo-1521572163474-6864f9cf17ab', 800),
  leatherBag: unsplash('photo-1584917865442-de89df76afd3', 800),
  silkBlouse: unsplash('photo-1551163943-3f6a855d1153', 800),
  woolTrousers: unsplash('photo-1624378439575-d8705ad7ae80', 800),
  silkBlazer: unsplash('photo-1591047139829-d91aecb6caea', 800),
  wovenTote: unsplash('photo-1548036328-c9fa89d128fa', 800),
  woolOvercoat: unsplash('photo-1539571696357-5a69c17a67c6', 800),
};
