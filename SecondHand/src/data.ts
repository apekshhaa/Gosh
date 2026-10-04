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

export const products: Product[] = [
  {
    id: 'brown-ruched-marble-skirt', title: 'Ruched Marble Skirt', brand: 'GOSH finds', price: 600,
    image: brownSkirtImage, images: [brownSkirtImage, brownSkirtStyleImage],
    category: 'womens', subcategory: 'Skirts', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Ruched marble-print skirt, worn only once.',
    measurements: 'Waist: 30 inches.', shipping: 'Shipping is included in the listed price.'
  },
  {
    id: 'black-top', title: 'Black Top', brand: 'GOSH finds', price: 400,
    image: blackTopImage, images: [blackTopImage, blackTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Black top.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is included in the listed price.'
  },
  {
    id: 'green-top', title: 'Green Top', brand: 'GOSH finds', price: 300,
    image: greenTopImage, images: [greenTopImage, greenTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Green top, worn once.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is included in the listed price.'
  },
  {
    id: 'red-top', title: 'Red Top', brand: 'GOSH finds', price: 250,
    image: redTopImage, images: [redTopImage, redTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Red top.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is included in the listed price.'
  },
  {
    id: 'brown-dress', title: 'Brown Dress', brand: 'NEWME', price: 800, originalPrice: 1600, discount: '-50%',
    image: brownDressImage, images: [brownDressImage, brownDressDescriptionImage],
    category: 'womens', subcategory: 'Dresses', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Brown dress by NEWME.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is included in the listed price.'
  },
  {
    id: 'floral-top', title: 'Floral Top', brand: 'GOSH finds', price: 300,
    image: floralTubeImage, images: [floralTubeImage, floralTopDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Floral top.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is included in the listed price.'
  },
  {
    id: 'blue-tube-top', title: 'Blue Tube Top', brand: 'GOSH finds', price: 200,
    image: blueTubeImage, images: [blueTubeImage, blueTubeDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Blue tube top, never worn.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is included in the listed price.'
  },
  {
    id: 'black-skirt', title: 'Black Skirt', brand: 'GOSH finds', price: 250,
    image: blackSkirtImage, images: [blackSkirtImage, blackSkirtDescriptionImage],
    category: 'womens', subcategory: 'Skirts', size: 'M', sizeLabel: 'S–M', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Black skirt with an elastic waist, fits sizes S–M.',
    measurements: 'Elastic waist; fits sizes S–M.', shipping: 'Shipping is included in the listed price.'
  },
  {
    id: 'purple-pullover', title: 'Purple Pullover', brand: 'GOSH finds', price: 200,
    image: purplePulloverImage, images: [purplePulloverImage, purplePulloverDescriptionImage],
    category: 'womens', subcategory: 'Tops', size: 'S', condition: 'Very Good', conditionConfirmed: false, material: 'Add fabric details',
    description: 'Purple pullover.',
    measurements: 'Add measurements if available.', shipping: 'Shipping is included in the listed price.'
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
