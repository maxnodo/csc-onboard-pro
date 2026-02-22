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
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablecer su contraseña — CSC</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>Corporación Socialista de Cemento</Heading>
        <Hr style={divider} />
        <Heading style={h1}>Restablecer su contraseña</Heading>
        <Text style={text}>
          Recibimos una solicitud para restablecer su contraseña en el sistema CSC.
          Haga clic en el botón a continuación para elegir una nueva contraseña.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Restablecer Contraseña
        </Button>
        <Text style={footer}>
          Si usted no solicitó este cambio, puede ignorar este correo de forma segura.
          Su contraseña no será modificada.
        </Text>
        <Hr style={divider} />
        <Text style={copyright}>
          © 2026 Corporación Socialista de Cemento. Todos los derechos reservados.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
