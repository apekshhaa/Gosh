import { Product } from './types';

// Starter listings are intentionally generic. Replace each photo, name, price,
// and item details with the owner's information as it arrives.
const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
const brownSkirtImage = new URL('../assets/images/brown_skirt.png', import.meta.url).href;
const brownSkirtStyleImage = new URL('../assets/images/brown_skirt_description.png', import.meta.url).href;
const blackTopImage = new URL('../assets/images/black_top.jpeg', import.meta.url).href;
const blackTopDescriptionImage = new URL('../assets/images/black_top_description.png', import.meta.url).href;
const brownDressImage = new URL('../assets/images/brown_dress.png', import.meta.url).href;
const brownDressDescriptionImage = new URL('../assets/images/brown_dress_desc.png', import.meta.url).href;
const greenTopImage = new URL('../assets/images/green_top.png', import.meta.url).href;
const greenTopDescriptionImage = new URL('../assets/images/green_top_desc.png', import.meta.url).href;
const redTopImage = new URL('../assets/images/red_top.png', import.meta.url).href;
const redTopDescriptionImage = new URL('../assets/images/red_top_desc.png', import.meta.url).href;
const floralTubeImage = new URL('../assets/images/floral_tube.png', import.meta.url).href;
const floralTopDescriptionImage = new URL('../assets/images/floral_top_desc.png', import.meta.url).href;
const blueTubeImage = new URL('../assets/images/blue_tube.png', import.meta.url).href;
const blueTubeDescriptionImage = new URL('../assets/images/blue_tube_desc.png', import.meta.url).href;
const blackSkirtImage = new URL('../assets/images/black_skirt.png', import.meta.url).href;
const blackSkirtDescriptionImage = new URL('../assets/images/black_skirt_desc.png', import.meta.url).href;
const purplePulloverImage = new URL('../assets/images/purple_pullover.png', import.meta.url).href;
const purplePulloverDescriptionImage = new URL('../assets/images/purple_pullover_desc.png', import.meta.url).href;
const stripeTopImage = new URL('../assets/images/stripe.png', import.meta.url).href;
const stripeTopDescriptionImage = new URL('../assets/images/strip_desc.png', import.meta.url).href;
const polkaSkirtImage = new URL('../assets/images/polka.png', import.meta.url).href;
const polkaSkirtDescriptionImage = new URL('../assets/images/polka_desc.png', import.meta.url).href;
const mensPantImage = new URL('../assets/images/pant1.png', import.meta.url).href;
const mensPant2Image = new URL('../assets/images/pant2.png', import.meta.url).href;
const mensPant3Image = new URL('../assets/images/pant3.png', import.meta.url).href;
const mensPant4Image = new URL('../assets/images/pant4.png', import.meta.url).href;
const dolceGabbanaJeansImage = new URL('../assets/images/dolche.png', import.meta.url).href;
const mensShirt1Image = new URL('../assets/images/shirt1.png', import.meta.url).href;
const mensShirt2Image = new URL('../assets/images/shirt2.png', import.meta.url).href;
const mensShirt3Image = new URL('../assets/images/shirt3.png', import.meta.url).href;
const mensShirtSetImage = new URL('../assets/images/set.png', import.meta.url).href;
const floralDressImage = new URL('../assets/images/floral_dress.png', import.meta.url).href;
const floralDressDescriptionImage = new URL('../assets/images/floral_desc.png', import.meta.url).href;
const redWhiteShirtImage = new URL('../assets/images/red_white.png', import.meta.url).href;

export const products: Product[] = [
  {
    id: 'brown-ruched-marble-skirt', title: 'Ruched Marble Skirt', brand: 'GOSH finds', price: 600,
    image: brownSkirtImage, images: [brownSkirtImage, brownSkirtStyleImage],
    category: 'womens', subcategory: 'Skirts', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A long skirt in a soft pink, cream and brown marble print, with gathered ruching running down the sides. Worn only once.',
    measurements: 'Waist: 30 inches.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'black-top', title: 'Black Top', brand: 'GOSH finds', price: 400,
    image: blackTopImage, images: [blackTopImage, blackTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A black sleeveless top with slim shoulder straps and a large cream floral motif across the front.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'green-top', title: 'Green Top', brand: 'GOSH finds', price: 300,
    image: greenTopImage, images: [greenTopImage, greenTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A cream cropped top with a delicate green leafy print, softly puffed sleeves and a gathered front. Worn once.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'red-top', title: 'Red Top', brand: 'GOSH finds', price: 250,
    image: redTopImage, images: [redTopImage, redTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A red long-sleeved top covered in a bold dark ornamental print, with a simple round neckline.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'brown-dress', title: 'Brown Dress', brand: 'NEWME', price: 800, originalPrice: 1600, discount: '-50%',
    image: brownDressImage, images: [brownDressImage, brownDressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A deep burgundy long-sleeved dress with an all-over lace pattern, crossover V-neck and gently flared skirt by NEWME.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'floral-top', title: 'Floral Tube Top', brand: 'GOSH finds', price: 300,
    image: floralTubeImage, images: [floralTubeImage, floralTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A strapless ruched top in a bright abstract floral print with pink, blue, purple, green and yellow tones.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'blue-tube-top', title: 'Blue Tube Top', brand: 'GOSH finds', price: 200,
    image: blueTubeImage, images: [blueTubeImage, blueTubeDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A light-blue tube-style top with a darker blue paisley print and softly draped, overlapping panels. Never worn.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'black-skirt', title: 'Black Skirt', brand: 'GOSH finds', price: 250,
    image: blackSkirtImage, images: [blackSkirtImage, blackSkirtDescriptionImage],
    category: 'womens', subcategory: 'Skirts', size: 'M', sizeLabel: 'S–M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A flowing black-and-ivory skirt with a bold zebra-inspired print, gathered elastic waist and circular buckle detail. Fits sizes S–M.',
    measurements: 'Elastic waist; fits sizes S–M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'purple-pullover', title: 'Purple Pullover', brand: 'GOSH finds', price: 200,
    image: purplePulloverImage, images: [purplePulloverImage, purplePulloverDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A cropped lavender pullover with an open-knit pattern, long sleeves and ribbed trim at the neckline, cuffs and hem.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'stripe-top', title: 'Stripe Top', brand: 'GOSH finds', price: 200,
    image: stripeTopImage, images: [stripeTopImage, stripeTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', sizeLabel: 'XXS (fits S)', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A relaxed short-sleeved top with fine taupe and white horizontal stripes and a wide, softly draped neckline. Label size XXS; fits size S.',
    measurements: 'Size XXS; fits S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'polka-skirt', title: 'Polka Dot Skirt', brand: 'GOSH finds', price: 350,
    image: polkaSkirtImage, images: [polkaSkirtImage, polkaSkirtDescriptionImage],
    category: 'womens', subcategory: 'Skirts', size: 'XS', sizeLabel: '26 / XS', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A black skirt covered in small white polka dots, with a long, flared shape and a front slit. Size 26 / XS.',
    measurements: 'Size 26 / XS.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-pant-1', title: 'Pant 1', brand: 'GOSH finds', price: 250,
    image: mensPantImage, images: [mensPantImage],
    category: 'mens', subcategory: 'Pants', size: 'M', sizeLabel: '30', filterSize: '30', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Light-wash blue jeans with a straight-leg shape, classic five-pocket styling and faded wash details. Men’s size 30.',
    measurements: 'Size 30.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-pant-2', title: 'Pant 2', brand: 'GOSH finds', price: 300,
    image: mensPant2Image, images: [mensPant2Image],
    category: 'mens', subcategory: 'Pants', size: 'M', sizeLabel: '30', filterSize: '30', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Light-grey wash jeans in a slim fit, with classic front pockets and belt loops.',
    measurements: 'Size 30 · Slim fit.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-pant-3', title: 'Pant 3', brand: 'GOSH finds', price: 300,
    image: mensPant3Image, images: [mensPant3Image],
    category: 'mens', subcategory: 'Pants', size: 'M', sizeLabel: '32', filterSize: '32', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Grey-wash jeans with a button-front waist, belt loops and classic front pockets.',
    measurements: 'Size 32.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-pant-4', title: 'Pant 4', brand: 'GOSH finds', price: 300,
    image: mensPant4Image, images: [mensPant4Image],
    category: 'mens', subcategory: 'Pants', size: 'M', sizeLabel: '34', filterSize: '34', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Light-wash blue jeans with a classic button waist, belt loops and straight legs.',
    measurements: 'Size 34.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-dolce-gabbana-jeans', title: 'Dolce & Gabbana Jeans', brand: 'Dolce & Gabbana', price: 500,
    image: dolceGabbanaJeansImage, images: [dolceGabbanaJeansImage],
    category: 'mens', subcategory: 'Pants', size: 'M', sizeLabel: '32', filterSize: '32', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Light-grey jeans from Dolce & Gabbana, with a classic five-pocket design, button closure and belt loops.',
    measurements: 'Size 32.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-shirt-1', title: 'Men Shirt 1', brand: 'GOSH finds', price: 200,
    image: mensShirt1Image, images: [mensShirt1Image],
    category: 'mens', subcategory: 'Shirts', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'An oversized light-grey short-sleeved T-shirt with a crew neckline and a graphic chest pocket.',
    measurements: 'Size S; oversized fit.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-shirt-2', title: 'Men Shirt 2', brand: 'GOSH finds', price: 250,
    image: mensShirt2Image, images: [mensShirt2Image],
    category: 'mens', subcategory: 'Shirts', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'An oversized light-grey short-sleeved T-shirt with a bold Punisher graphic across the back.',
    measurements: 'Size S; oversized fit.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-shirt-3', title: 'Men Shirt 3', brand: 'GOSH finds', price: 250,
    image: mensShirt3Image, images: [mensShirt3Image],
    category: 'mens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A pale blue long-sleeved crew-neck top with ribbed cuffs and hem.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'mens-shirt-set', title: 'Men’s Shirt Set (3 Pieces)', brand: 'GOSH finds', price: 600,
    image: mensShirtSetImage, images: [mensShirtSetImage],
    category: 'mens', subcategory: 'Sets', size: 'M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A set of three boys’ shirts in light green, blue plaid and navy pinstripe. Suitable for around 16 years old; size M.',
    measurements: 'Size M; suitable for around 16 years old. ₹250 each when bought separately, or ₹600 for all three as a set.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'floral-dress', title: 'Floral Dress', brand: 'GOSH finds', price: 500,
    image: floralDressImage, images: [floralDressImage, floralDressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A black dress with a pink floral print, wrap-style V-neck, tie waist, flared cuffs and a ruffled hem.',
    measurements: 'Size M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'red-white-shirt', title: 'Red and White Check Shirt', brand: 'GOSH finds', price: 150,
    image: redWhiteShirtImage, images: [redWhiteShirtImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A red long-sleeved shirt with a white windowpane check and button-front detail.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  }
];

export const heroSlides = [{
  title: 'Good clothes deserve another outing.',
  subtitle: 'A little collection of skirts, tops and dresses, ready for a new wardrobe.',
  cta: 'Browse the collection',
  bgImage: image('photo-1483985988355-763728e1935b')
}];

export const curatedHighlights = [];
export const missionStatement = { headline: 'A small edit, made personal', paragraphs: ['GOSH is a place for skirts, tops and dresses to find a new home.'], image: image('photo-1483985988355-763728e1935b') };
