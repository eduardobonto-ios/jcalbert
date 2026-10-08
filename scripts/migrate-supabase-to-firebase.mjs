// One-off migration: Supabase (schema "jcalbert" + storage bucket "jcalbert")
//   -> Firestore: "tours" docs embed their images/highlights/activities (keeps
//      reads low on the free Spark plan); location, reviews, messaging and
//      sales_report are one collection each. Doc id = Supabase row id.
//   -> Cloudinary (every file in the bucket + inline base64 review photos)
//
// Usage:  node scripts/migrate-supabase-to-firebase.mjs [--dry-run]
// Reads credentials from .env.migration (see .env.example).
// Safe to re-run: Cloudinary public_ids and Firestore doc ids are deterministic.

import dotenv from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

dotenv.config({ path: '.env.migration', override: true });

const DRY_RUN = process.argv.includes('--dry-run');
const SCHEMA = 'jcalbert';
const BUCKET = 'jcalbert';
const CLOUDINARY_FOLDER = 'jcalbert';
// Supabase tables to read (the tour_* child tables are embedded into "tours")
const TABLES = [
  'location',
  'tours',
  'tour_images',
  'tour_highlights',
  'tour_activities',
  'reviews',
  'messaging',
  'sales_report',
];

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.migration`);
  return value;
};

const SUPABASE_URL = required('SUPABASE_URL').replace(/\/$/, '');
const SUPABASE_KEY = required('SUPABASE_SERVICE_ROLE_KEY');
const requiredUnlessDryRun = (name) => (DRY_RUN ? process.env[name] : required(name));
const CLOUD_NAME = requiredUnlessDryRun('CLOUDINARY_CLOUD_NAME');
const CLOUD_KEY = requiredUnlessDryRun('CLOUDINARY_API_KEY');
const CLOUD_SECRET = requiredUnlessDryRun('CLOUDINARY_API_SECRET');
const SERVICE_ACCOUNT_PATH = requiredUnlessDryRun('FIREBASE_SERVICE_ACCOUNT_PATH');

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

// ---------------------------------------------------------------------------
// Supabase reads
// ---------------------------------------------------------------------------
async function fetchTable(table) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc`, {
      headers: { ...supabaseHeaders, 'Accept-Profile': SCHEMA, Range: `${from}-${from + pageSize - 1}` },
    });
    if (!res.ok) throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function listBucket(prefix = '') {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { ...supabaseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 10000 }),
  });
  if (!res.ok) throw new Error(`Supabase storage list: ${res.status} ${await res.text()}`);
  const entries = await res.json();
  const files = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) files.push(...(await listBucket(path))); // folder
    else files.push(path);
  }
  return files;
}

const publicStorageUrl = (path) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

// ---------------------------------------------------------------------------
// Cloudinary upload (signed, by remote URL or data URI — no SDK needed)
// ---------------------------------------------------------------------------
async function uploadToCloudinary(file, publicId) {
  const params = { overwrite: 'true', public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)) };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + CLOUD_SECRET).digest('hex');

  const body = new URLSearchParams({ ...params, file, api_key: CLOUD_KEY, signature });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body });
  const json = await res.json();
  if (!res.ok) throw new Error(`Cloudinary ${publicId}: ${json.error?.message ?? res.status}`);
  return json.secure_url;
}

// ---------------------------------------------------------------------------
// Firestore
// ---------------------------------------------------------------------------
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

const toFirestoreDoc = (row) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      key.endsWith('_at') && typeof value === 'string' && ISO_TIMESTAMP.test(value)
        ? Timestamp.fromDate(new Date(value))
        : value,
    ])
  );

const bySortOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

function embedTourChildren({ tours, tour_images, tour_highlights, tour_activities }) {
  const childrenOf = (rows, tourId) => rows.filter((row) => String(row.tour_id) === String(tourId)).sort(bySortOrder);

  return tours.map((tour) => ({
    ...tour,
    images: childrenOf(tour_images, tour.id)
      .filter((image) => typeof image.tours_images_2 === 'string' && image.tours_images_2.trim())
      .map((image) => ({ url: image.tours_images_2, label: image.label ?? tour.name })),
    highlights: childrenOf(tour_highlights, tour.id).map((row) => row.highlight),
    activities: childrenOf(tour_activities, tour.id).map((row) => row.activity),
  }));
}

async function writeCollection(db, name, rows) {
  for (let i = 0; i < rows.length; i += 400) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + 400)) {
      batch.set(db.collection(name).doc(String(row.id)), toFirestoreDoc(row));
    }
    await batch.commit();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(DRY_RUN ? '*** DRY RUN — nothing will be written ***\n' : '');

  // 1. Read everything from Supabase
  const data = {};
  for (const table of TABLES) {
    data[table] = await fetchTable(table);
    console.log(`Supabase ${table}: ${data[table].length} rows`);
  }
  fs.mkdirSync('scripts/migration-output', { recursive: true });
  fs.writeFileSync('scripts/migration-output/supabase-backup.json', JSON.stringify(data, null, 2));

  const files = await listBucket();
  console.log(`Supabase storage "${BUCKET}": ${files.length} files\n`);

  // 2. Storage bucket -> Cloudinary
  const urlMap = {}; // old Supabase URL -> Cloudinary URL
  for (const [i, path] of files.entries()) {
    const publicId = `${CLOUDINARY_FOLDER}/${path.replace(/\.[^.]+$/, '')}`;
    const oldUrl = publicStorageUrl(path);
    urlMap[oldUrl] = DRY_RUN ? `(cloudinary)/${publicId}` : await uploadToCloudinary(oldUrl, publicId);
    console.log(`[${i + 1}/${files.length}] ${path} -> ${urlMap[oldUrl]}`);
  }

  // 3. Rewrite image references
  const missing = [];
  for (const image of data.tour_images) {
    const url = image.tours_images_2;
    if (typeof url === 'string' && url.includes('.supabase.co/storage/')) {
      const clean = decodeURI(url.split('?')[0]);
      const mapped = urlMap[url] ?? urlMap[clean];
      if (mapped) image.tours_images_2 = mapped;
      else missing.push(url);
    }
  }
  if (missing.length) {
    console.warn(`\nWARNING: ${missing.length} tour_images reference files not in the bucket (left unchanged):`);
    missing.forEach((url) => console.warn(`  ${url}`));
  }

  for (const review of data.reviews) {
    if (typeof review.reviews_photo === 'string' && review.reviews_photo.startsWith('data:')) {
      const publicId = `${CLOUDINARY_FOLDER}/reviews/review_${review.id}`;
      review.reviews_photo = DRY_RUN ? `(cloudinary)/${publicId}` : await uploadToCloudinary(review.reviews_photo, publicId);
      console.log(`review ${review.id} photo -> ${review.reviews_photo}`);
    }
  }

  const collections = {
    location: data.location,
    tours: embedTourChildren(data),
    reviews: data.reviews,
    messaging: data.messaging,
    sales_report: data.sales_report,
  };

  fs.writeFileSync('scripts/migration-output/url-map.json', JSON.stringify(urlMap, null, 2));
  fs.writeFileSync('scripts/migration-output/firestore-preview.json', JSON.stringify(collections, null, 2));

  if (DRY_RUN) {
    console.log('\nDry run complete. Output in scripts/migration-output/');
    return;
  }

  // 4. Collections -> Firestore
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  console.log('');
  for (const [name, rows] of Object.entries(collections)) {
    await writeCollection(db, name, rows);
    const count = (await db.collection(name).count().get()).data().count;
    console.log(`Firestore ${name}: wrote ${rows.length}, collection now has ${count} docs`);
  }

  console.log('\nMigration complete.');
}

main().catch((error) => {
  console.error('\nMigration failed:', error);
  process.exit(1);
});
