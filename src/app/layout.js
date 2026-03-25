import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'Zazza-Spot',
  description: 'Scopri e condividi i migliori spot',
}

export default function RootLayout({ children }) {
  return (
    <html lang='it'>
      <body className={geist.className}>
        {children}
      </body>
    </html>
  )
}
