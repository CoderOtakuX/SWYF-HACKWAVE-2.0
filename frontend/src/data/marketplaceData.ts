export interface MarketplaceProduct {
  id: string;
  name: string;
  brand: string;
  brandLogo: string;
  price: number;
  originalPrice?: number;
  category: 'MENS' | 'WOMENS' | 'UNISEX';
  sizes: string[];
  imageUrl: string;
  images: string[];
  skinToneTags: string[];
  colorTags: string[];
  dominantColor: string;
  fabric: string;
  description: string;
  rating: number;
  reviews: number;
}

export const VENDORS = [
  { id: 'v1', name: 'Desi Threads', logo: '🧵', tagline: 'Authentic ethnic fashion' },
  { id: 'v2', name: 'UrbanWeave', logo: '🏙️', tagline: 'Modern streetwear essentials' },
  { id: 'v3', name: 'EthnicHub', logo: '🪷', tagline: 'Traditional meets contemporary' },
];

export const MOCK_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'mp-001',
    name: 'Royal Indigo Silk Kurta',
    brand: 'Desi Threads',
    brandLogo: '🧵',
    price: 1899,
    originalPrice: 2499,
    category: 'MENS',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=1000&fit=crop',
    ],
    skinToneTags: ['cool_deep', 'cool_light', 'Winter'],
    colorTags: ['Indigo', 'Navy'],
    dominantColor: '#4B0082',
    fabric: 'Pure Silk Blend',
    description: 'Handwoven silk kurta with intricate thread work. Perfect for festive occasions and wedding ceremonies.',
    rating: 4.7,
    reviews: 132,
  },
  {
    id: 'mp-002',
    name: 'Emerald Cotton Anarkali',
    brand: 'EthnicHub',
    brandLogo: '🪷',
    price: 2499,
    originalPrice: 3299,
    category: 'WOMENS',
    sizes: ['XS', 'S', 'M', 'L'],
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1618151313441-bc79c11e5090?w=1000&fit=crop',
    ],
    skinToneTags: ['warm_medium', 'warm_dark', 'Autumn', 'Spring'],
    colorTags: ['Emerald', 'Green'],
    dominantColor: '#008000',
    fabric: 'Premium Cotton',
    description: 'Flowing anarkali in rich emerald green with gold zari border. A statement piece for any celebration.',
    rating: 4.8,
    reviews: 256,
  },
  {
    id: 'mp-003',
    name: 'Midnight Streetwear Hoodie',
    brand: 'UrbanWeave',
    brandLogo: '🏙️',
    price: 1299,
    originalPrice: 1799,
    category: 'UNISEX',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1000&fit=crop',
    ],
    skinToneTags: ['cool_deep', 'neutral', 'Winter', 'Summer'],
    colorTags: ['Black', 'Charcoal'],
    dominantColor: '#1a1a2e',
    fabric: '100% Organic Cotton',
    description: 'Premium oversized hoodie with Japanese-inspired minimalist design. Everyday essential for urban style.',
    rating: 4.5,
    reviews: 89,
  },
  {
    id: 'mp-004',
    name: 'Saffron Banarasi Saree',
    brand: 'Desi Threads',
    brandLogo: '🧵',
    price: 4999,
    category: 'WOMENS',
    sizes: ['Free Size'],
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=1000&fit=crop',
    ],
    skinToneTags: ['warm_medium', 'warm_light', 'Autumn', 'Spring'],
    colorTags: ['Saffron', 'Orange', 'Gold'],
    dominantColor: '#FF9933',
    fabric: 'Banarasi Silk',
    description: 'Luxurious handloom Banarasi saree with gold zari work. Heirloom quality craftsmanship.',
    rating: 4.9,
    reviews: 312,
  },
  {
    id: 'mp-005',
    name: 'Slate Tech-Fit Joggers',
    brand: 'UrbanWeave',
    brandLogo: '🏙️',
    price: 999,
    originalPrice: 1499,
    category: 'MENS',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&fit=crop',
    ],
    skinToneTags: ['neutral', 'cool_light', 'Summer', 'Winter'],
    colorTags: ['Grey', 'Slate'],
    dominantColor: '#708090',
    fabric: 'Tech-Poly Blend',
    description: 'Engineered joggers with four-way stretch and hidden zip pockets. Built for the modern man on the move.',
    rating: 4.3,
    reviews: 67,
  },
  {
    id: 'mp-006',
    name: 'Ruby Georgette Lehenga',
    brand: 'EthnicHub',
    brandLogo: '🪷',
    price: 3499,
    originalPrice: 4499,
    category: 'WOMENS',
    sizes: ['S', 'M', 'L'],
    imageUrl: '/assets/marketplace/ruby-georgette-lehenga.svg',
    images: [
      '/assets/marketplace/ruby-georgette-lehenga.svg',
    ],
    skinToneTags: ['cool_deep', 'warm_dark', 'Winter', 'Autumn'],
    colorTags: ['Red', 'Maroon', 'Ruby'],
    dominantColor: '#800000',
    fabric: 'Premium Georgette',
    description: 'Show-stopping lehenga set with mirror work and sequin embellishments. The ultimate bridal pick.',
    rating: 4.8,
    reviews: 198,
  },
  {
    id: 'mp-007',
    name: 'Ocean Wash Denim Jacket',
    brand: 'UrbanWeave',
    brandLogo: '🏙️',
    price: 1799,
    originalPrice: 2299,
    category: 'UNISEX',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=1000&fit=crop',
    ],
    skinToneTags: ['cool_light', 'neutral', 'Summer', 'Winter'],
    colorTags: ['Blue', 'Denim'],
    dominantColor: '#4169E1',
    fabric: 'Premium Denim',
    description: 'Classic denim jacket with a vintage ocean wash finish. Pairs with everything in your wardrobe.',
    rating: 4.6,
    reviews: 143,
  },
  {
    id: 'mp-008',
    name: 'Pearl White Chikankari Kurti',
    brand: 'Desi Threads',
    brandLogo: '🧵',
    price: 1599,
    category: 'WOMENS',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: '/assets/marketplace/pearl-white-chikankari-kurti.svg',
    images: [
      '/assets/marketplace/pearl-white-chikankari-kurti.svg',
    ],
    skinToneTags: ['warm_light', 'cool_light', 'Spring', 'Summer'],
    colorTags: ['White', 'Pearl', 'Ivory'],
    dominantColor: '#FFF5EE',
    fabric: 'Lucknowi Cotton',
    description: 'Delicate hand-embroidered chikankari kurti from Lucknow. Breathable elegance for everyday wear.',
    rating: 4.7,
    reviews: 210,
  },
  {
    id: 'mp-009',
    name: 'Terracotta Linen Shirt',
    brand: 'UrbanWeave',
    brandLogo: '🏙️',
    price: 1399,
    originalPrice: 1899,
    category: 'MENS',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1000&fit=crop',
    ],
    skinToneTags: ['warm_medium', 'warm_dark', 'Autumn'],
    colorTags: ['Terracotta', 'Rust', 'Brown'],
    dominantColor: '#CC5533',
    fabric: 'European Linen',
    description: 'Relaxed-fit linen shirt in warm terracotta. The effortless summer essential.',
    rating: 4.4,
    reviews: 78,
  },
  {
    id: 'mp-010',
    name: 'Sapphire Embroidered Sherwani',
    brand: 'EthnicHub',
    brandLogo: '🪷',
    price: 4499,
    originalPrice: 5999,
    category: 'MENS',
    sizes: ['M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/marketplace/sapphire-embroidered-sherwani.svg',
    images: [
      '/assets/marketplace/sapphire-embroidered-sherwani.svg',
    ],
    skinToneTags: ['cool_deep', 'neutral', 'Winter'],
    colorTags: ['Sapphire', 'Blue', 'Navy'],
    dominantColor: '#0F52BA',
    fabric: 'Velvet & Silk Blend',
    description: 'Regal sherwani with hand-embroidered motifs. The definitive choice for the modern groom.',
    rating: 4.9,
    reviews: 87,
  },
  {
    id: 'mp-011',
    name: 'Olive Cargo Trousers',
    brand: 'UrbanWeave',
    brandLogo: '🏙️',
    price: 1199,
    category: 'UNISEX',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1000&fit=crop',
    ],
    skinToneTags: ['warm_medium', 'neutral', 'Autumn', 'Spring'],
    colorTags: ['Olive', 'Green', 'Khaki'],
    dominantColor: '#6B8E23',
    fabric: 'Canvas Cotton',
    description: 'Utility-inspired cargo trousers with a relaxed tapered fit. Built tough, styled easy.',
    rating: 4.2,
    reviews: 54,
  },
  {
    id: 'mp-012',
    name: 'Blush Pink Palazzo Set',
    brand: 'EthnicHub',
    brandLogo: '🪷',
    price: 1999,
    originalPrice: 2799,
    category: 'WOMENS',
    sizes: ['XS', 'S', 'M', 'L'],
    imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1000&fit=crop',
      'https://images.unsplash.com/photo-1563178299-f1d39276903f?w=1000&fit=crop',
    ],
    skinToneTags: ['warm_light', 'cool_light', 'Spring', 'Summer'],
    colorTags: ['Pink', 'Blush', 'Rose'],
    dominantColor: '#FFB6C1',
    fabric: 'Rayon Crepe',
    description: 'Softly structured palazzo set in delicate blush pink. Effortless comfort meets occasion wear.',
    rating: 4.6,
    reviews: 167,
  },
];

// Simple color distance for "Chromatch" scoring
export function calculateMatchScore(
  userSeason: string | undefined,
  userTone: string | undefined,
  product: MarketplaceProduct
): number | null {
  if (!userSeason && !userTone) return null;

  let score = 60; // base

  // Season-based matching (primary signal)
  if (userSeason && product.skinToneTags.some(t => t.toLowerCase() === userSeason.toLowerCase())) {
    score += 25;
  }

  // Tone-based matching
  if (userTone) {
    const toneCanonical = userTone.toLowerCase().replace(/\s+/g, '_');
    if (product.skinToneTags.some(t => t.toLowerCase().replace(/\s+/g, '_') === toneCanonical)) {
      score += 10;
    }
    // broad warm/cool matching
    if (toneCanonical.includes('warm') && product.skinToneTags.some(t => t.includes('warm'))) score += 5;
    if (toneCanonical.includes('cool') && product.skinToneTags.some(t => t.includes('cool'))) score += 5;
  }

  return Math.min(score, 99);
}
