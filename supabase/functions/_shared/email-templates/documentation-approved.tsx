/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface DocumentationApprovedEmailProps {
  fullName: string
}

export const DocumentationApprovedEmail = ({
  fullName,
}: DocumentationApprovedEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Documentación aprobada — CSC</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>Corporación Socialista de Cemento</Heading>
        <Hr style={divider} />
        <Heading style={h1}>¡Documentación Aprobada!</Heading>
        <Text style={text}>
          Estimado/a <strong>{fullName}</strong>,
        </Text>
        <Text style={text}>
          Le informamos que su documentación ha sido revisada y{' '}
          <strong>aprobada exitosamente</strong>.
        </Text>
        <Text style={text}>
          Para completar su proceso de registro, debe acercarse a la sucursal
          más cercana de la Corporación Socialista de Cemento con su documento
          de identidad original.
        </Text>
        <Text style={text}>
          Un representante autorizado verificará su identidad y finalizará
          su activación en el sistema.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>
          Este es un correo automático del Sistema de Onboarding Documental de la CSC.
          Por favor no responda a este mensaje.
        </Text>
        <Text style={copyright}>
          © 2026 Corporación Socialista de Cemento. Todos los derechos reservados.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default DocumentationApprovedEmail

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
  color: '#16a34a',
  margin: '20px 0 16px',
  fontFamily: "'Tahoma', Geneva, sans-serif",
}
const divider = { borderColor: '#d5dbe3', margin: '16px 0' }
const text = { fontSize: '14px', color: '#5f6b7a', lineHeight: '1.6', margin: '0 0 20px' }
const footer = { fontSize: '12px', color: '#5f6b7a', margin: '30px 0 0' }
const copyright = { fontSize: '11px', color: '#999999', margin: '8px 0 0' }
