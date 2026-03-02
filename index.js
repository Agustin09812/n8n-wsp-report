import express from 'express'
import dotenv from 'dotenv'
import QRCode from 'qrcode'
import { initSession, getSession, getQR } from './baileys.js'
import fs from 'fs'
import path from 'path'

dotenv.config()

const app = express()
app.use(express.json())
app.use(express.static('public'))

const PORT = process.env.PORT || 3000

// 🔐 Middleware SOLO para API privada
const protect = (req, res, next) => {
  const token = req.headers['x-api-key']

  if (token !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

// 🔌 Crear sesión (desde página)
app.post('/connect', async (req, res) => {
  const { sessionId } = req.body

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId requerido' })
  }

  await initSession(sessionId)

  res.json({ success: true })
})

// 🖼 Obtener QR
app.get('/qr/:sessionId', async (req, res) => {
  const qr = getQR(req.params.sessionId)

  if (!qr) {
    return res.status(404).json({ error: 'QR no disponible aún' })
  }

  const qrImage = await QRCode.toDataURL(qr)

  res.json({ qr: qrImage })
})

// 📤 Enviar reporte (protegido)
app.post('/send-report', protect, async (req, res) => {
  try {
    const { sessionId, to, message } = req.body

    if (!sessionId || !to || !message) {
      return res.status(400).json({ error: 'Missing parameters' })
    }

    const sock = getSession(sessionId)

    if (!sock) {
      return res.status(400).json({ error: 'Session not connected' })
    }

    await sock.sendMessage(to, { text: message })

    res.json({ success: true })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal error' })
  }
})

app.listen(PORT, () => {

  console.log(`\n🚀 Server running on port ${PORT}\n`)

  const publicPath = path.join(process.cwd(), 'public')

  if (fs.existsSync(publicPath)) {

    const files = fs.readdirSync(publicPath)

    const htmlFiles = files.filter(file => file.endsWith('.html'))

    console.log('📄 Páginas públicas disponibles:\n')

    htmlFiles.forEach(file => {

      if (file === 'index.html') {
        console.log(`👉 http://localhost:${PORT}/`)
      } else {
        console.log(`👉 http://localhost:${PORT}/${file}`)
      }

    })

    console.log('\n')
  }

})