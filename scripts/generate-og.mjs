import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const templatePath = join(__dirname, 'og-template.html')
const outputPath = join(__dirname, '..', 'public', 'og-image.png')

const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()

await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle0' })

await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()

console.log(`OG image generated → public/og-image.png`)
