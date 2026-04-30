/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
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
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Conferma la tua email per GlowUp</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Benvenuto su GlowUp! ✨</Heading>
        <Text style={text}>
          Grazie per aver scelto <strong>GlowUp</strong> per gestire la tua attività.
        </Text>
        <Text style={text}>
          Per completare la registrazione e iniziare a usare la piattaforma, conferma il tuo indirizzo email (<strong>{recipient}</strong>) cliccando il pulsante qui sotto:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Conferma Email
        </Button>
        <Text style={footer}>
          Se non hai creato un account su GlowUp, puoi ignorare questa email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#19101a',
  margin: '0 0 24px',
}
const text = {
  fontSize: '15px',
  color: '#664d5a',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: '#d64077',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
