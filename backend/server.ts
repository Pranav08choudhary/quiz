import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'
import axios from 'axios' // Import axios to handle HTTP requests

dotenv.config()

const app = express()
const PORT = 5000

app.use(cors())
app.use(bodyParser.json())

const certificatesDir = path.join(__dirname, 'certificates')

// Ensure the certificates directory exists
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir)
}

// Define LinkedIn User interface (Add any other fields as needed)
interface LinkedInUser {
  id: string
  firstName: { localized: { en_US: string } }
  lastName: { localized: { en_US: string } }
}

// Redirect route to LinkedIn login
app.get('/linkedin/login', (req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI
  //const scope = 'r_liteprofile r_emailaddress w_member_social';  // Define the scopes you need
  const state = 'random_state_string' // A random string to prevent CSRF

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}&state=${state}`

  // Redirect user to LinkedIn login page
  res.redirect(authUrl)
})

// Callback route to handle LinkedIn's redirect with authorization code
app.get('/linkedin/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing.' })
  }

  try {
    // Exchange the authorization code for an access token
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken'
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('code', code as string)
    params.append('redirect_uri', redirectUri)
    params.append('client_id', clientId)
    params.append('client_secret', clientSecret)

    const response = await axios.post(tokenUrl, params)

    const { access_token, expires_in } = response.data
    console.log('Access Token:', access_token)

    // Send access token to the client or store it securely
    res.json({ access_token, expires_in })
  } catch (error) {
    console.error('Error exchanging code for access token:', error)
    res.status(500).json({ error: 'Failed to exchange code for access token.' })
  }
})

// Certificate Download Endpoint
app.get(
  '/api/download',
  async (req: Request<{}, {}, {}, { name: string; percent: string }>, res: Response) => {
    const { name, percent } = req.query

    if (!name || !percent) {
      return res.status(400).json({ error: 'Name and percent are required.' })
    }

    try {
      // Generate the certificate
      const doc = new jsPDF('landscape')
      doc.setFontSize(24)
      doc.text('Certificate of Completion', 40, 50)
      doc.setFontSize(18)
      doc.text(`Awarded to: ${name}`, 40, 70)
      doc.text(`Score: ${percent}%`, 40, 90)

      // Save the PDF
      const filePath = path.join(certificatesDir, `${name}_certificate.pdf`)
      const pdfContent = doc.output()
      fs.writeFileSync(filePath, pdfContent, 'binary')

      // Serve the file URL
      res.json({ fileUrl: `/certificates/${name}_certificate.pdf` })
    } catch (error) {
      // Error handling with type narrowing
      if (error instanceof Error) {
        console.error('Error generating certificate:', error.message)
        res.status(500).json({ error: error.message })
      } else {
        console.error('Unknown error generating certificate.')
        res.status(500).json({ error: 'Failed to generate certificate.' })
      }
    }
  }
)

// Serve the certificates folder
app.use('/certificates', express.static(certificatesDir))

// LinkedIn Share Endpoint
app.post(
  '/api/linkedin/share',
  async (
    req: Request<{}, {}, { accessToken: string; message: string }, {}>,
    res: Response
  ) => {
    const { accessToken, message } = req.body

    if (!accessToken || !message) {
      return res.status(400).json({ error: 'Access token and message are required.' })
    }

    try {
      // Get the user's LinkedIn ID
      const userResponse = await fetch('https://api.linkedin.com/v2/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch LinkedIn user info.')
      }

      // Safely parse and assert the response as a LinkedInUser
      const user = await userResponse.json()
      const linkedinUser = user as LinkedInUser // Type assertion here
      const userId = linkedinUser.id

      // Share on LinkedIn
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: `urn:li:person:${userId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: message },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      })

      if (response.ok) {
        res.status(200).json({ message: 'Successfully shared on LinkedIn!' })
      } else {
        const error = await response.json()
        console.error('LinkedIn API Error:', error)
        res
          .status(response.status)
          .json({ error: error.message || 'LinkedIn share failed.' })
      }
    } catch (error: unknown) {
      // Error handling with type narrowing
      if (error instanceof Error) {
        console.error('Error sharing on LinkedIn:', error.message)
        res.status(500).json({ error: error.message })
      } else {
        console.error('An unknown error occurred.')
        res.status(500).json({ error: 'An error occurred while sharing on LinkedIn.' })
      }
    }
  }
)

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
