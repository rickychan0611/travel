#!/usr/bin/env node

import { existsSync, readdirSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { enrichProductLocations, locationReviewEntry } from './lib/location-enrichment.mjs'

const root = resolve('data/toursbms-products')
const apply = process.argv.includes('--apply')
const reportPath = resolve('data/shopify-sync/location-review.json')

function filesIn(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(path) : entry.isFile() && entry.name.endsWith('.json') ? [path] : []
  })
}

const reviews = []
let changed = 0
for (const file of filesIn(root)) {
  const original = await readFile(file, 'utf8')
  const json = enrichProductLocations(JSON.parse(original))
  const output = `${JSON.stringify(json, null, 2)}\n`
  if (output !== original) {
    changed += 1
    if (apply) await writeFile(file, output, 'utf8')
  }
  const review = locationReviewEntry(json, file)
  if (review) reviews.push(review)
}

const report = { generatedAt: new Date().toISOString(), mode: apply ? 'apply' : 'dry-run', scanned: filesIn(root).length, changed, reviewCount: reviews.length, products: reviews }
await mkdir(dirname(reportPath), { recursive: true })
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(`${apply ? 'Enriched' : 'Would enrich'} ${changed} files; ${reviews.length} need review.`)
console.log(`Review report: ${reportPath}`)
