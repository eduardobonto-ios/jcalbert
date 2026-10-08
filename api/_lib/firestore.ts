// Shared Firestore access for the Vercel functions in /api and the local
// Express server (server.ts). Files under api/_lib are not deployed as routes.
//
// Credentials, in order of preference:
//   1. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (Vercel)
//   2. FIREBASE_SERVICE_ACCOUNT_PATH pointing at the downloaded JSON key (local dev)
import fs from 'node:fs';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';

function loadServiceAccount(): ServiceAccount {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_SERVICE_ACCOUNT_PATH } = process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Vercel stores the key with literal "\n" sequences
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  if (FIREBASE_SERVICE_ACCOUNT_PATH) {
    return JSON.parse(fs.readFileSync(FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
  }

  throw new Error(
    'Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_PATH.'
  );
}

let db: Firestore | undefined;

// Lazy so env vars loaded by dotenv in server.ts are picked up.
export function getDb(): Firestore {
  if (!db) {
    const app = getApps()[0] ?? initializeApp({ credential: cert(loadServiceAccount()) });
    db = getFirestore(app);
  }
  return db;
}

export interface TourDoc {
  id: string;
  name: string;
  location: string;
  description: string;
  price: number;
  original_price?: number | null;
  is_best_seller?: boolean | null;
  images?: { url: string; label?: string | null }[];
  highlights?: string[];
  activities?: string[];
}

// Read-mostly endpoints are cached at Vercel's edge so most page views never
// touch Firestore (Spark plan: 50k reads/day).
export const PUBLIC_CACHE_HEADER = 'public, s-maxage=300, stale-while-revalidate=86400';

export async function getTours(): Promise<TourDoc[]> {
  const snapshot = await getDb().collection('tours').get();
  return snapshot.docs.map((doc) => {
    const { created_at: _createdAt, ...tour } = doc.data();
    return { ...tour, id: doc.id } as TourDoc;
  });
}

export async function getReviews(): Promise<{ id: number; reviews_photo: string }[]> {
  const snapshot = await getDb().collection('reviews').get();
  return snapshot.docs
    .map((doc) => ({ id: Number(doc.data().id ?? doc.id), reviews_photo: doc.data().reviews_photo as string }))
    .filter((review) => review.reviews_photo)
    .sort((a, b) => a.id - b.id);
}

export async function getLocationNames(): Promise<string[]> {
  const snapshot = await getDb().collection('location').orderBy('location_name').get();
  return snapshot.docs.map((doc) => doc.data().location_name as string).filter(Boolean);
}

export async function addMessage(message: {
  customer_booking_id: string | null;
  full_name: string;
  contact_email: string;
  message: string;
}) {
  await getDb().collection('messaging').add({ ...message, created_at: FieldValue.serverTimestamp() });
}

export async function addSalesReport(report: { booking_id: number; reservation_fee: number; total_amount: number }) {
  await getDb().collection('sales_report').add({ ...report, created_at: FieldValue.serverTimestamp() });
}
