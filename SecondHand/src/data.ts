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
const offShoulderImage = new URL('../assets/images/off_shoulder.png', import.meta.url).href;
const offShoulderDescriptionImage = new URL('../assets/images/off_shoulder_desc.png', import.meta.url).href;
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
const womensJeans1Image = new URL('../assets/images/jeans1.png', import.meta.url).href;
const womensJeans2Image = new URL('../assets/images/jeans2.png', import.meta.url).href;
const womensJeans3Image = new URL('../assets/images/jeans3.png', import.meta.url).href;
const womensCargoImage = new URL('../assets/images/cargo.png', import.meta.url).href;
const colorfulDressImage = new URL('../assets/images/color.png', import.meta.url).href;
const colorfulDressDescriptionImage = new URL('../assets/images/colour_desc.png', import.meta.url).href;
const pinkTopImage = new URL('../assets/images/pinkk.png', import.meta.url).href;
const pinkTopDescriptionImage = new URL('../assets/images/pinkk_desc.png', import.meta.url).href;
const pinkJumpsuitImage = new URL('../assets/images/pant_top.png', import.meta.url).href;
const pinkJumpsuitDescriptionImage = new URL('../assets/images/pant_top_desc.png', import.meta.url).href;
const knotTopImage = new URL('../assets/images/knot.png', import.meta.url).href;
const knotTopDescriptionImage = new URL('../assets/images/knot_desc.png', import.meta.url).href;
const blackTieTopImage = new URL('../assets/images/blackk.png', import.meta.url).href;
const blackTieTopDescriptionImage = new URL('../assets/images/blackk_desc.png', import.meta.url).href;
const jaanuDressImage = new URL('../assets/images/jaanu1.png', import.meta.url).href;
const jaanuDressDescriptionImage = new URL('../assets/images/jaanu1_desc.png', import.meta.url).href;
const jaanu2DressImage = new URL('../assets/images/jaanu2.png', import.meta.url).href;
const jaanu2DressDescriptionImage = new URL('../assets/images/jaanu2_desc.png', import.meta.url).href;
const jaanu3DressImage = new URL('../assets/images/jaanu3.png', import.meta.url).href;
const jaanu3DressDescriptionImage = new URL('../assets/images/jaanu3_desc.png', import.meta.url).href;
const jaanu4DressImage = new URL('../assets/images/jaanu4.png', import.meta.url).href;
const jaanu4DressDescriptionImage = new URL('../assets/images/jaanu4_desc.png', import.meta.url).href;
const jaanu5DressImage = new URL('../assets/images/jaanu5.png', import.meta.url).href;
const jaanu5DressDescriptionImage = new URL('../assets/images/jaanu5_desc.png', import.meta.url).href;
const jaanu6DressImage = new URL('../assets/images/jaanu6.png', import.meta.url).href;
const jaanu6DressDescriptionImage = new URL('../assets/images/jaanu6_desc.png', import.meta.url).href;
const jaanu7DressImage = new URL('../assets/images/jaanu7.png', import.meta.url).href;
const jaanu7DressDescriptionImage = new URL('../assets/images/jaanu7_desc.png', import.meta.url).href;
const jaanu8TopImage = new URL('../assets/images/jaanu8.png', import.meta.url).href;
const jaanu8TopDescriptionImage = new URL('../assets/images/jaanu8_desc.png', import.meta.url).href;
const jaanu9TopImage = new URL('../assets/images/jaanu9.png', import.meta.url).href;
const jaanu9TopDescriptionImage = new URL('../assets/images/jaanu9_desc.png', import.meta.url).href;
const bowDressImage = new URL('../assets/images/bow_dress.png', import.meta.url).href;
const bowDressDescriptionImage = new URL('../assets/images/bow_dress_desc.png', import.meta.url).href;
const jaanu12BlouseImage = new URL('../assets/images/jaanu12.png', import.meta.url).href;
const jaanu12BlouseDescriptionImage = new URL('../assets/images/jaanu12_desc.png', import.meta.url).href;
const jaanu11TopImage = new URL('../assets/images/jaanu11.png', import.meta.url).href;
const jaanu11TopDescriptionImage = new URL('../assets/images/jaanu11_desc.png', import.meta.url).href;
const jaanu10TopImage = new URL('../assets/images/jaanu10.png', import.meta.url).href;
const jaanu10TopDescriptionImage = new URL('../assets/images/jaanu10_desc.png', import.meta.url).href;
const skortImage = new URL('../assets/images/skort.png', import.meta.url).href;
const skortDescriptionImage = new URL('../assets/images/skort_desc.png', import.meta.url).href;
const purpleDressImage = new URL('../assets/images/purple_dress.png', import.meta.url).href;
const purpleDressDescriptionImage = new URL('../assets/images/purple_dress_desc.png', import.meta.url).href;
const whiteTopImage = new URL('../assets/images/white_top.png', import.meta.url).href;
const whiteTopDescriptionImage = new URL('../assets/images/white_top_desc.png', import.meta.url).href;

export const products: Product[] = [
  {
    id: 'brown-ruched-marble-skirt', title: 'Ruched Marble Skirt', brand: 'GOSH finds', price: 500,
    image: brownSkirtImage, images: [brownSkirtImage, brownSkirtStyleImage],
    category: 'womens', subcategory: 'Skirts', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A long skirt in a soft pink, cream and brown marble print, with gathered ruching running down the sides. Worn only once.',
    measurements: 'Waist: 30 inches.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'black-top', title: 'Black Top', brand: 'GOSH finds', price: 400,
    image: blackTopImage, images: [blackTopImage, blackTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'M', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'Very nice condition', material: 'Add fabric details',
    description: 'A black sleeveless top with slim shoulder straps and a large cream floral motif across the front.',
    measurements: '', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'green-top', title: 'Green Top', brand: 'GOSH finds', price: 300,
    image: greenTopImage, images: [greenTopImage, greenTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'Lovely condition overall', material: 'Add fabric details',
    description: 'A cream cropped top with a delicate green leafy print, softly puffed sleeves and a gathered front. Worn once.',
    measurements: '', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'red-top', title: 'Red Printed Top', brand: 'GOSH finds', price: 250,
    image: redTopImage, images: [redTopImage, redTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'In very nice condition', material: 'Add fabric details',
    description: 'A red long-sleeved top covered in a bold dark ornamental print, with a simple round neckline.',
    measurements: '', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'brown-dress', title: 'Brown Dress', brand: 'NEWME', price: 600, originalPrice: 1600, discount: '-63%',
    image: brownDressImage, images: [brownDressImage, brownDressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A deep burgundy long-sleeved dress with an all-over lace pattern, crossover V-neck and gently flared skirt by NEWME.',
    measurements: '', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'floral-top', title: 'Floral Tube Top', brand: 'GOSH finds', price: 300,
    image: floralTubeImage, images: [floralTubeImage, floralTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'A very nice pre-loved piece', material: 'Add fabric details',
    description: 'A strapless ruched top in a bright abstract floral print with pink, blue, purple, green and yellow tones.',
    measurements: '', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'blue-tube-top', title: 'Blue Tube Top', brand: 'GOSH finds', price: 300,
    image: blueTubeImage, images: [blueTubeImage, blueTubeDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'Very nice condition overall', material: 'Add fabric details',
    description: 'A light-blue tube-style top with a darker blue paisley print and softly draped, overlapping panels. Never worn.',
    measurements: '', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'black-skirt', title: 'Black and White Skirt', brand: 'GOSH finds', price: 300,
    image: blackSkirtImage, images: [blackSkirtImage, blackSkirtDescriptionImage],
    category: 'womens', subcategory: 'Skirts', size: 'M', sizeLabel: 'S–M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A flowing black-and-ivory skirt with a bold zebra-inspired print, gathered elastic waist and circular buckle detail. Fits sizes S–M.',
    measurements: 'Elastic waist; fits sizes S–M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'purple-pullover', title: 'Lavender Pullover', brand: 'GOSH finds', price: 350, isSoldOut: true,
    image: purplePulloverImage, images: [purplePulloverImage, purplePulloverDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'In lovely condition', material: 'Add fabric details',
    description: 'A cropped lavender pullover with an open-knit pattern, long sleeves and ribbed trim at the neckline, cuffs and hem.',
    measurements: '', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'stripe-top', title: 'Cold Shoulder Top', brand: 'GOSH finds', price: 200,
    image: stripeTopImage, images: [stripeTopImage, stripeTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', sizeLabel: 'XXS (fits S)', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'Very nice, well-presented condition', material: 'Add fabric details',
    description: 'A relaxed short-sleeved top with fine taupe and white horizontal stripes, shoulder cut-outs and a wide, softly draped neckline. Label size XXS; fits size S.',
    measurements: 'Size XXS; fits S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'off-shoulder-top', title: 'Off Shoulder Top', brand: 'GOSH finds', price: 450,
    image: offShoulderImage, images: [offShoulderImage, offShoulderDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'In lovely, very nice condition', material: 'Add fabric details',
    description: 'An off-shoulder top in size S.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'polka-skirt', title: 'Polka Dot Skirt', brand: 'GOSH finds', price: 400, isSoldOut: true,
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
    id: 'mens-shirt-3', title: 'Blue Shirt', brand: 'GOSH finds', price: 250,
    image: mensShirt3Image, images: [mensShirt3Image],
    category: 'mens', subcategory: 'Shirts', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
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
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'A lovely piece in very nice condition', material: 'Add fabric details',
    description: 'A red long-sleeved shirt with a white windowpane check and button-front detail.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'womens-jeans-1', title: 'Women’s Jeans 1', brand: 'GOSH finds', price: 0,
    image: womensJeans1Image, images: [womensJeans1Image],
    category: 'womens', subcategory: 'Jeans', size: 'M', sizeLabel: '30', filterSize: '30', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Light-wash blue jeans with a slim fit and classic five-pocket styling.',
    measurements: 'Size 30.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'womens-jeans-2', title: 'Women’s Flared Jeans', brand: 'GOSH finds', price: 0,
    image: womensJeans2Image, images: [womensJeans2Image],
    category: 'womens', subcategory: 'Jeans', size: 'M', sizeLabel: '32 (fits 30)', filterSize: '30', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Blue high-waisted jeans with a flared leg.',
    measurements: 'Label size 32; fits size 30.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'womens-jeans-3', title: 'Torn Blue Jeans', brand: 'GOSH finds', price: 0,
    image: womensJeans3Image, images: [womensJeans3Image],
    category: 'womens', subcategory: 'Jeans', size: 'M', sizeLabel: 'Fits 28–30', filterSize: 'M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Blue jeans with distressed, torn details.',
    measurements: 'Fits sizes 28–30.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'womens-cargo', title: 'Cargo Trousers', brand: 'GOSH finds', price: 0,
    image: womensCargoImage, images: [womensCargoImage],
    category: 'womens', subcategory: 'Trousers', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Greenish-tone cargo trousers with a drawstring waist and side pockets.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'white-top', title: 'White Top', brand: 'GOSH finds', price: 300,
    image: whiteTopImage, images: [whiteTopImage, whiteTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'L', sizeLabel: 'L (fits M)', filterSize: 'L', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'Very nice condition and ready to wear', material: 'Add fabric details',
    description: 'A white short-sleeved top with a gathered drawstring detail at the side.',
    measurements: 'Label size L; fits M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'colorful-striped-dress', title: 'Colorful Striped Dress', brand: 'GOSH finds', price: 400,
    image: colorfulDressImage, images: [colorfulDressImage, colorfulDressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'L', sizeLabel: 'L (fits M)', filterSize: 'L', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A sleeveless maxi dress with bold multicolor stripes and a gathered waist.',
    measurements: 'Label size L; fits M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'pink-striped-top', title: 'Pink Striped Top', brand: 'GOSH finds', price: 300,
    image: pinkTopImage, images: [pinkTopImage, pinkTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', sizeLabel: 'S (fits M)', filterSize: 'S', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'In lovely condition', material: 'Add fabric details',
    description: 'A short-sleeved pink-and-white striped top with ribbed trim.',
    measurements: 'Label size S; fits M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'pink-and-black-jumpsuit', title: 'Pink and Black Jumpsuit', brand: 'GOSH finds', price: 400,
    image: pinkJumpsuitImage, images: [pinkJumpsuitImage, pinkJumpsuitDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A one-piece jumpsuit with a bright pink button-front blouse, voluminous sleeves and black wide-leg trousers.',
    measurements: 'Size M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'grey-striped-knot-top', title: 'Grey Striped Knot Top', brand: 'GOSH finds', price: 300,
    image: knotTopImage, images: [knotTopImage, knotTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'M', sizeLabel: 'XL (fits S and M)', filterSize: 'M', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'Very nice pre-loved condition', material: 'Add fabric details',
    description: 'A long-sleeved grey-and-white striped top with a front knot detail.',
    measurements: 'Label size XL; fits S and M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'black-tie-front-top', title: 'Black Tie-Front Top', brand: 'GOSH finds', price: 300,
    image: blackTieTopImage, images: [blackTieTopImage, blackTieTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'M', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'A very nice top in lovely condition', material: 'Add fabric details',
    description: 'A black short-sleeved top with contrast white trim and a tie detail at the neckline.',
    measurements: 'Size M.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu-floral-dress', title: 'Floral Sundress', brand: 'GOSH finds', price: 350, isSoldOut: true,
    image: jaanuDressImage, images: [jaanuDressImage, jaanuDressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A sleeveless sundress with a mint, yellow and white floral print and a gathered bodice.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu2-floral-dress', title: 'White Floral Dress', brand: 'GOSH finds', price: 350, isSoldOut: true,
    image: jaanu2DressImage, images: [jaanu2DressImage, jaanu2DressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A white mini dress with a small floral print, puff sleeves and a softly gathered neckline.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu3-brown-polo-dress', title: 'Brown Polo Dress', brand: 'GOSH finds', price: 300, isSoldOut: true,
    image: jaanu3DressImage, images: [jaanu3DressImage, jaanu3DressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'XS', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A brown short-sleeved polo dress with cream chest stripes and a button placket.',
    measurements: 'Size XS.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu4-floral-slip-dress', title: 'Floral Slip Dress', brand: 'GOSH finds', price: 300, isSoldOut: true,
    image: jaanu4DressImage, images: [jaanu4DressImage, jaanu4DressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'XS', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A dark plum floral slip dress with lace trim, adjustable straps and an asymmetrical layered hem.',
    measurements: 'Size XS.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu5-pink-floral-maxi-dress', title: 'Pink Floral Maxi Dress', brand: 'GOSH finds', price: 400, isSoldOut: true,
    image: jaanu5DressImage, images: [jaanu5DressImage, jaanu5DressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A pink floral maxi dress with a draped neckline, tie-up shoulder straps and a softly ruched waist.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu6-striped-shirt-dress', title: 'Striped Shirt Dress', brand: 'GOSH finds', price: 400,
    image: jaanu6DressImage, images: [jaanu6DressImage, jaanu6DressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A black-and-white vertically striped shirt dress with three-quarter sleeves, buttons and a tie waist.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu7-lilac-floral-dress', title: 'Lilac Floral Dress', brand: 'GOSH finds', price: 300, isSoldOut: true,
    image: jaanu7DressImage, images: [jaanu7DressImage, jaanu7DressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'XS', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A lilac floral-print dress with puff sleeves, a front tie and a ruffled hem.',
    measurements: 'Size XS.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu8-ribbed-sleeveless-top', title: 'Ribbed Sleeveless Top', brand: 'GOSH finds', price: 200,
    image: jaanu8TopImage, images: [jaanu8TopImage, jaanu8TopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'XS', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'In very nice, well-kept condition', material: 'Soft ribbed fabric',
    description: 'An off-white ribbed sleeveless top with a classic crew neckline and fitted silhouette.',
    measurements: 'Size XS.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu9-daisy-floral-tee', title: 'Daisy Floral Tee', brand: 'GOSH finds', price: 250,
    image: jaanu9TopImage, images: [jaanu9TopImage, jaanu9TopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'XS', sizeLabel: 'XS', filterSize: 'XS', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'A lovely top in very nice condition', material: 'Ribbed stretch fabric',
    description: 'A fitted cream T-shirt with a delicate daisy print, classic crew neckline and short sleeves.',
    measurements: 'Size XS.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'bow-print-bodycon-dress', title: 'Bow Print Bodycon Dress', brand: 'GOSH finds', price: 450,
    image: bowDressImage, images: [bowDressImage, bowDressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', sizeLabel: 'S', filterSize: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A black bow-print bodycon mini dress with a ruched bodice, off-shoulder neckline, sheer long sleeves and flared cuffs.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu12-ivory-eyelet-blouse', title: 'Ivory Eyelet Blouse', brand: 'GOSH finds', price: 350,
    image: jaanu12BlouseImage, images: [jaanu12BlouseImage, jaanu12BlouseDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'XS', sizeLabel: 'XS', filterSize: 'XS', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'Very nice condition with a lovely finish', material: 'Eyelet fabric',
    description: 'An ivory blouse with eyelet embroidery, ruffle sleeves, a deep V neckline and a ruched front with tie-up detail.',
    measurements: 'Size XS.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu11-polka-dot-peplum-top', title: 'Polka Dot Peplum Top', brand: 'GOSH finds', price: 400,
    image: jaanu11TopImage, images: [jaanu11TopImage, jaanu11TopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', sizeLabel: 'Not specified', filterSize: 'Unspecified', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'Very nice condition, with a lovely finish', material: 'Lightweight textured fabric',
    description: 'A cream sleeveless peplum top with a subtle polka-dot pattern, spaghetti straps, a smocked waist and a ruffled hem.',
    measurements: 'Size not specified.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'jaanu10-blush-textured-top', title: 'Blush Textured Top', brand: 'GOSH finds', price: 400,
    image: jaanu10TopImage, images: [jaanu10TopImage, jaanu10TopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'XS', sizeLabel: 'XS', filterSize: 'XS', condition: 'Very Good', conditionConfirmed: true, conditionNote: 'In very nice condition with a textured finish', material: 'Textured fabric',
    description: 'A cropped blush-pink top with a classic collar, long sleeves and a pointed hem.',
    measurements: 'Size XS.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'pinstripe-tie-skort', title: 'Pinstripe Tie Skort', brand: 'GOSH finds', price: 400,
    image: skortImage, images: [skortImage, skortDescriptionImage],
    category: 'womens', subcategory: 'Skirts', size: 'S', sizeLabel: 'S', filterSize: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A black pinstripe skort with an adjustable waist tie, A-line shape and shorts underneath.',
    measurements: 'Size S.', shipping: 'Shipping is charged separately. Free shipping on orders over ₹900.'
  },
  {
    id: 'sky-blue-shirt-dress', title: 'Sky Blue Shirt Dress', brand: 'GOSH finds', price: 400,
    image: purpleDressImage, images: [purpleDressImage, purpleDressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', sizeLabel: 'S', filterSize: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'A sky-blue button-down shirt dress with delicate dotted stripes, a classic collar and a softly defined waist.',
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
export const missionStatement = { headline: 'A small edit, made personal', paragraphs: ['Shop pre-loved clothes or message GOSH to ask about listing your own, giving good pieces a chance to find a new home.'], image: image('photo-1483985988355-763728e1935b') };
