/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirme su cambio de correo electrónico — CSC</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>Corporación Socialista de Cemento</Heading>
        <Hr style={divider} />
        <Heading style={h1}>Confirme su cambio de correo</Heading>
        <Text style={text}>
          Usted solicitó cambiar su dirección de correo electrónico en el sistema CSC de{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          a{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>
          Haga clic en el botón a continuación para confirmar este cambio:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar Cambio de Correo
        </Button>
        <Text style={footer}>
          Si usted no solicitó este cambio, asegure su cuenta de inmediato.
        </Text>
        <Hr style={divider} />
        <Text style={copyright}>
          © 2026 Corporación Socialista de Cemento. Todos los derechos reservados.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Tahoma', Geneva, sans-serif" }
const container = { padding: '30px 25px' }
const brand = {
  fontSize: '20px',
  fontWeight: '700' as const,
  color: '#CC1D21',
  margin: '0 0 8px',
  fontFamily: "'Tahoma', Geneva, sans-serif",
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1f2937',
  margin: '20px 0 16px',
  fontFamily: "'Tahoma', Geneva, sans-serif",
}
const divider = { borderColor: '#d5dbe3', margin: '16px 0' }
const text = { fontSize: '14px', color: '#5f6b7a', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#CC1D21', textDecoration: 'underline' }
const button = {
  backgroundColor: '#CC1D21',
  color: '#f5f7fa',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#5f6b7a', margin: '30px 0 0' }
const copyright = { fontSize: '11px', color: '#999999', margin: '8px 0 0' }
