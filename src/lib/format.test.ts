import { formatBudget, formatPhone, formatPrice, formatSurface, plural, telHref, whatsappHref } from './format'

describe('format', () => {
  it('formate les prix en FCFA comme le contrat backend', () => {
    expect(formatPrice(150_000_000)).toBe('150 000 000 FCFA')
    expect(formatPrice(850_000, 'month')).toBe('850 000 FCFA / mois')
    expect(formatPrice(null)).toBe('Prix sur demande')
  })

  it('abrège les budgets', () => {
    expect(formatBudget(1_000_000_000)).toBe('1 Md FCFA')
    expect(formatBudget(75_000_000)).toBe('75 M FCFA')
    expect(formatBudget(1_500_000)).toBe('1,5 M FCFA')
    expect(formatBudget(300_000)).toBe('300 000 FCFA')
  })

  it('formate les surfaces et ignore les valeurs absentes', () => {
    expect(formatSurface(140, 'sqm')).toBe('140 m²')
    expect(formatSurface(2.5, 'hectare')).toBe('2,5 ha')
    expect(formatSurface(null)).toBeNull()
  })

  it('accorde le pluriel', () => {
    expect(plural(1, 'chambre')).toBe('1 chambre')
    expect(plural(3, 'chambre')).toBe('3 chambres')
  })

  it('formate et lie les numéros de téléphone', () => {
    expect(formatPhone('+221770001122')).toBe('+221 77 000 11 22')
    expect(formatPhone('+33612345678')).toBe('+33612345678')
    expect(telHref('+221 77 000 11 22')).toBe('tel:+221770001122')
    expect(whatsappHref('+221770001122', 'Bonjour à vous')).toBe('https://wa.me/221770001122?text=Bonjour%20%C3%A0%20vous')
  })
})
