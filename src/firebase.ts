import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, setDoc, doc, getDoc, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import { BlogArticle } from './blogData';
import { SiteContent } from './siteContent';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use custom firestore database ID if specified in config
export const db = config.firestoreDatabaseId 
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Helper function to submit a consultation
export interface ConsultationSubmission {
  id?: string;
  name: string;
  age: string;
  contact: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'contacted';
  source: 'website';
}

export async function submitConsultation(submission: Omit<ConsultationSubmission, 'createdAt' | 'status' | 'source'>) {
  try {
    const colRef = collection(db, 'consultations');
    const docRef = await addDoc(colRef, {
      ...submission,
      createdAt: new Date().toISOString(),
      status: 'unread',
      source: 'website'
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    console.error('Error submitting consultation to Firebase:', e);
    throw e;
  }
}

// Helper to get all consultations (for Admin panel)
export async function getConsultations(): Promise<ConsultationSubmission[]> {
  try {
    const colRef = collection(db, 'consultations');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const submissions: ConsultationSubmission[] = [];
    snapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      } as ConsultationSubmission);
    });
    return submissions;
  } catch (e) {
    console.error('Error fetching consultations from Firebase:', e);
    return [];
  }
}

// Helper to update consultation status
export async function updateConsultationStatus(id: string, status: 'unread' | 'read' | 'contacted') {
  try {
    const docRef = doc(db, 'consultations', id);
    await updateDoc(docRef, { status });
    return true;
  } catch (e) {
    console.error('Error updating consultation status:', e);
    return false;
  }
}

// Helper to delete a consultation
export async function deleteConsultation(id: string) {
  try {
    const docRef = doc(db, 'consultations', id);
    await deleteDoc(docRef);
    return true;
  } catch (e) {
    console.error('Error deleting consultation:', e);
    return false;
  }
}

// Save blog articles to Firestore (under collection 'cms', document 'blog')
export async function saveBlogArticlesToFirestore(articles: BlogArticle[]): Promise<boolean> {
  try {
    const docRef = doc(db, 'cms', 'blog');
    await setDoc(docRef, { articles });
    console.log('Successfully saved blog articles to Firestore');
    return true;
  } catch (e) {
    console.error('Error saving blog articles to Firestore:', e);
    return false;
  }
}

// Get blog articles from Firestore (returns null if not exists or on error)
export async function getBlogArticlesFromFirestore(): Promise<BlogArticle[] | null> {
  try {
    const docRef = doc(db, 'cms', 'blog');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.articles as BlogArticle[];
    }
    return null;
  } catch (e) {
    console.error('Error getting blog articles from Firestore:', e);
    return null;
  }
}

// Save site content to Firestore (under collection 'cms', document 'site')
export async function saveSiteContentToFirestore(content: SiteContent): Promise<boolean> {
  try {
    const docRef = doc(db, 'cms', 'site');
    await setDoc(docRef, { content });
    console.log('Successfully saved site content to Firestore');
    return true;
  } catch (e) {
    console.error('Error saving site content to Firestore:', e);
    return false;
  }
}

// Get site content from Firestore (returns null if not exists or on error)
export async function getSiteContentFromFirestore(): Promise<SiteContent | null> {
  try {
    const docRef = doc(db, 'cms', 'site');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.content as SiteContent;
    }
    return null;
  } catch (e) {
    console.error('Error getting site content from Firestore:', e);
    return null;
  }
}
