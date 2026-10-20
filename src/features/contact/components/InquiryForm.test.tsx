import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppError } from '@/lib/errors'
import { renderWithRouter } from '@/test/render'
import * as forms from '../api/formsService'
import { InquiryForm } from './InquiryForm'

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Nom complet/), 'Awa Diop')
  await user.type(screen.getByLabelText('Téléphone'), '77 123 45 67')
  await user.selectOptions(screen.getByLabelText('Votre projet'), 'invest')
  await user.type(screen.getByLabelText(/Votre message/), 'Budget 100 M FCFA')
  await user.click(screen.getByRole('button', { name: /Envoyer ma demande/ }))
}

describe('InquiryForm', () => {
  it('envoie une demande normalisée et confirme seulement après réponse du backend', async () => {
    const spy = vi.spyOn(forms, 'submitInquiry').mockResolvedValue({ id: 'abc', duplicate: false })
    renderWithRouter(<InquiryForm />)
    await fillAndSubmit()

    expect(await screen.findByText('Merci, votre demande est bien enregistrée.')).toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Awa Diop',
        phone: '+221771234567',
        email: null,
        inquiry_type: 'general',
        message: '[Je souhaite investir] Budget 100 M FCFA',
        website: '',
        form_started_at: expect.any(Number),
      }),
    )
  })

  it('n’affiche pas de succès si l’envoi échoue', async () => {
    vi.spyOn(forms, 'submitInquiry').mockRejectedValue(new AppError('rate_limited'))
    renderWithRouter(<InquiryForm />)
    await fillAndSubmit()

    expect(await screen.findByText('Votre demande n’a pas été envoyée.')).toBeInTheDocument()
    expect(screen.queryByText(/bien enregistrée/)).not.toBeInTheDocument()
  })

  it('affiche les erreurs de champ renvoyées par le backend', async () => {
    vi.spyOn(forms, 'submitInquiry').mockRejectedValue(
      new AppError('validation', 'x', { fields: { phone: 'Numéro de téléphone invalide.' } }),
    )
    renderWithRouter(<InquiryForm />)
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByLabelText('Téléphone')).toHaveAttribute('aria-invalid', 'true'))
    expect(screen.getByText('Numéro de téléphone invalide.')).toBeInTheDocument()
  })

  it('bloque l’envoi et signale les champs manquants', async () => {
    const spy = vi.spyOn(forms, 'submitInquiry')
    renderWithRouter(<InquiryForm />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Envoyer ma demande/ }))
    expect(await screen.findByText('Merci d’indiquer votre nom.')).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
  })
})
