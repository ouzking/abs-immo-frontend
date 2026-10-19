/**
 * Photographies éditoriales du site (public/assets/photos), déclinées en AVIF,
 * WebP et JPEG à plusieurs largeurs. Ce sont des vues de Dakar sous licence
 * Creative Commons (crédits : page Mentions légales) : elles illustrent le
 * contexte et ne représentent JAMAIS un bien commercialisé.
 */
export interface PhotoAsset {
  /** Clé des textes alternatifs traduits (messages.photos). */
  id: 'corniche' | 'quartiers' | 'coucherSoleil'
  name: string
  widths: number[]
  fallbackWidth: number
  width: number
  height: number
  credit: { author: string; license: string; licenseUrl: string; source: string }
}

export const PHOTOS = {
  corniche: {
    id: 'corniche',
    name: 'dakar-corniche',
    widths: [768, 1280, 1920, 2560],
    fallbackWidth: 1920,
    width: 3619,
    height: 2036,
    credit: {
      author: 'Jeff Attaway',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
      source: 'https://commons.wikimedia.org/wiki/File:Dakar_Senegal_-_Looking_North_(5274051599).jpg',
    },
  },
  quartiers: {
    id: 'quartiers',
    name: 'dakar-quartiers',
    widths: [480, 800, 1200],
    fallbackWidth: 1200,
    width: 1936,
    height: 2420,
    credit: {
      author: 'Jeff Attaway',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
      source: 'https://commons.wikimedia.org/wiki/File:Dakar,_Senegal_-_Left_Half_(5662420768).jpg',
    },
  },
  coucherSoleil: {
    id: 'coucherSoleil',
    name: 'dakar-coucher-soleil',
    widths: [768, 1280, 1920],
    fallbackWidth: 1920,
    width: 6000,
    height: 2625,
    credit: {
      author: 'Fawaz.tairou',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      source: 'https://commons.wikimedia.org/wiki/File:Gor%C3%A9e_2024_-_coucher_de_soleil_sur_Dakar_-_25.jpg',
    },
  },
} satisfies Record<string, PhotoAsset>

