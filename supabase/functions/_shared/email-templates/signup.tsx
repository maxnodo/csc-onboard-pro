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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirme su correo electrónico — CSC</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>Corporación Socialista de Cemento</Heading>
        <Hr style={divider} />
        <Heading style={h1}>Confirme su correo electrónico</Heading>
        <Text style={text}>
          Gracias por registrarse en el Sistema de Onboarding Documental de la{' '}
          <Link href={siteUrl} style={link}><strong>CSC</strong></Link>.
        </Text>
        <Text style={text}>
          Por favor confirme su dirección de correo (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) haciendo clic en el botón a continuación:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verificar Correo Electrónico
        </Button>
        <Text style={footer}>
          Si usted no creó una cuenta, puede ignorar este correo de forma segura.
        </Text>
        <Hr style={divider} />
        <Text style={copyright}>
          © 2026 Corporación Socialista de Cemento. Todos los derechos reservados.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const brand = {
  fontSize: '20px',
  fontWeight: '700' as const,
  color: '#1e3a5f',
  margin: '0 0 8px',
  fontFamily: "'Playfair Display', Georgia, serif",
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1f2937',
  margin: '20px 0 16px',
  fontFamily: "'Playfair Display', Georgia, serif",
}
const divider = { borderColor: '#d5dbe3', margin: '16px 0' }
const text = { fontSize: '14px', color: '#5f6b7a', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#1e3a5f', textDecoration: 'underline' }
const button = {
  backgroundColor: '#1e3a5f',
  color: '#f5f7fa',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#5f6b7a', margin: '30px 0 0' }
const copyright = { fontSize: '11px', color: '#999999', margin: '8px 0 0' }
