import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

// Middleware
app.use(cors())

// Middleware to handle JSON body with size limit
app.use(express.json({ limit: '1mb' }))

// Middleware to handle URL-encoded body with size limit
app.use(express.urlencoded({ limit: '1mb', extended: true }))

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')))

// Certificates directory setup
const certificatesDir = path.resolve(__dirname, 'certificates')
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir)
}

// Validate LinkedIn environment variables
if (
  !process.env.LINKEDIN_CLIENT_ID ||
  !process.env.LINKEDIN_CLIENT_SECRET ||
  !process.env.LINKEDIN_REDIRECT_URI
) {
  throw new Error('Missing required LinkedIn environment variables.')
}

// LinkedIn User Interface
interface LinkedInUser {
  id: string
  firstName: { localized: { en_US: string } }
  lastName: { localized: { en_US: string } }
}

// LinkedIn Login Route
app.get('/linkedin/login', (req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!
  const scope = 'openid profile email w_member_social'
  const state = 'random_state_string'

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}&state=${state}`

  res.redirect(authUrl)
})

// LinkedIn Callback Route
app.get(
  '/linkedin/callback',
  async (req: Request<{}, {}, {}, { code?: string }>, res: Response) => {
    const { code } = req.query
    const clientId = process.env.LINKEDIN_CLIENT_ID!
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI!

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing.' })
    }

    try {
      const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken'
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      })

      const response = await axios.post(tokenUrl, params)
      const { access_token, expires_in } = response.data

      res.json({ access_token, expires_in })
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Axios Error:', error.response?.data || error.message)
        res.status(error.response?.status || 500).json({ error: error.message })
      } else if (error instanceof Error) {
        console.error('Error:', error.message)
        res.status(500).json({ error: error.message })
      } else {
        console.error('Unknown error:', error)
        res.status(500).json({ error: 'An unknown error occurred.' })
      }
    }
  }
)

// Certificate Download Endpoint
app.get(
  '/api/download',
  async (
    req: Request<{}, {}, {}, { name?: string; percent?: string }>,
    res: Response
  ) => {
    const { name, percent } = req.query

    if (!name || !percent) {
      return res.status(400).json({ error: 'Name and percent are required.' })
    }

    try {
      const doc = new jsPDF('landscape')
      doc.setFontSize(24)
      doc.text('Certificate of Completion', 40, 50)
      doc.setFontSize(18)
      doc.text(`Awarded to: ${name}`, 40, 70)
      doc.text(`Score: ${percent}%`, 40, 90)

      const filePath = path.join(certificatesDir, `${name}_certificate.pdf`)
      const pdfContent = Buffer.from(doc.output('arraybuffer'))
      fs.writeFileSync(filePath, pdfContent)

      const fileUrl = `${req.protocol}://${req.get(
        'host'
      )}/certificates/${name}_certificate.pdf`
      res.json({ fileUrl })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error generating certificate:', error.message)
        res.status(500).json({ error: error.message })
      } else {
        console.error('Unknown error:', error)
        res.status(500).json({ error: 'Failed to generate certificate.' })
      }
    }
  }
)

// Serve certificates folder
app.use('/certificates', express.static(certificatesDir))

// LinkedIn Share Endpoint
app.post('/api/linkedin/share', async (req: Request, res: Response) => {
  const { accessToken, message } = req.body

  if (!accessToken || !message) {
    return res.status(400).json({ error: 'Access token and message are required.' })
  }

  try {
    const userResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer AQXi6EXAraKbku_xH8OOQRcpzdNOH5YSzvO8Wn9fx-nlc3QJvZXVHPt3HSzjHa2jtEHIUp9chWESTZkWYG3aCIjYw0HfQAHP8Gc5Zi6jLEmDRZy0mB72ZGJRxoX2IvgA1HHhmJNKVmCxq840IE2xN8GnLAQXz0lpy9U9D9U1BejiILpDmBbdKSllUCPrG56PklRPQJ1wt_HKSy-up8WGz2YGBW6kL2NCecoVcKbD3lfNJJMR1MDJrXhMNYQWkHTBEaO6L16XSS9SX_7tk_zWgbVTaES5klKezN4R0klpi_pRIxGTYKiTgLvAK9JU_lWCg7JzeU2cZLX7ifPCUWzWsH1KZNs7Ow`,
      },
    })

    const linkedinUser = userResponse.data as LinkedInUser

    if (!linkedinUser || !linkedinUser.id) {
      return res.status(500).json({ error: 'Invalid LinkedIn user information.' })
    }

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:085a66206`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: message },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      },
      {
        headers: {
          Authorization: `Bearer AQXi6EXAraKbku_xH8OOQRcpzdNOH5YSzvO8Wn9fx-nlc3QJvZXVHPt3HSzjHa2jtEHIUp9chWESTZkWYG3aCIjYw0HfQAHP8Gc5Zi6jLEmDRZy0mB72ZGJRxoX2IvgA1HHhmJNKVmCxq840IE2xN8GnLAQXz0lpy9U9D9U1BejiILpDmBbdKSllUCPrG56PklRPQJ1wt_HKSy-up8WGz2YGBW6kL2NCecoVcKbD3lfNJJMR1MDJrXhMNYQWkHTBEaO6L16XSS9SX_7tk_zWgbVTaES5klKezN4R0klpi_pRIxGTYKiTgLvAK9JU_lWCg7JzeU2cZLX7ifPCUWzWsH1KZNs7Ow`,
          'Content-Type': 'application/json',
        },
      }
    )

    res.status(200).json({ message: 'Successfully shared on LinkedIn!' })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('LinkedIn API Error:', error.response?.data || error.message)
      res.status(error.response?.status || 500).json({ error: error.message })
    } else if (error instanceof Error) {
      console.error('Error:', error.message)
      res.status(500).json({ error: error.message })
    } else {
      console.error('Unknown error:', error)
      res
        .status(500)
        .json({ error: 'An unknown error occurred while sharing on LinkedIn.' })
    }
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
