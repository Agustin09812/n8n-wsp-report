import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'

const sessions = {}
const qrStore = {}

export const initSession = async (sessionId) => {

  const sessionPath = `./sessions/${sessionId}`

  if (!fs.existsSync('./sessions')) {
    fs.mkdirSync('./sessions')
  }

  // 🔥 SI EXISTE, BORRAR (SIEMPRE QR NUEVO)
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true })
    console.log(`🗑 Sesión anterior eliminada: ${sessionId}`)
  }

  fs.mkdirSync(sessionPath)

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update

    if (qr) {
      qrStore[sessionId] = qr
      console.log(`📲 QR generado para sesión: ${sessionId}`)
    }

    if (connection === 'open') {
      console.log(`✅ Sesión ${sessionId} conectada correctamente`)
      delete qrStore[sessionId]
    }

    if (connection === 'close') {
      console.log(`❌ Sesión ${sessionId} desconectada`)
    }
  })

  sessions[sessionId] = sock
}

export const getSession = (sessionId) => sessions[sessionId]
export const getQR = (sessionId) => qrStore[sessionId]