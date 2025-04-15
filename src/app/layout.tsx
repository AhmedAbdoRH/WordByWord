import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'VocabMaster Arabic',
  description: 'Learn Arabic Vocabulary',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script type="module">
          {`
            // Import the functions you need from the SDKs you need
            import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
            import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
            import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
            // TODO: Add SDKs for Firebase products that you want to use
            // https://firebase.google.com/docs/web/setup#available-libraries

            // Your web app's Firebase configuration
            // For Firebase JS SDK v7.20.0 and later, measurementId is optional
            const firebaseConfig = {
              apiKey: "AIzaSyAunLxvASN6Cbsa_Nc6l78_5lMhe5fP2Qg",
              authDomain: "momtn-ecab7.firebaseapp.com",
              projectId: "momtn-ecab7",
              storageBucket: "momtn-ecab7.firebasestorage.app",
              messagingSenderId: "98544311111",
              appId: "1:98544311111:web:0158668f45ae34818fca62",
              measurementId: "G-W164SZBMDP"
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            const analytics = getAnalytics(app);

            // Initialize Firestore
            window.db = getFirestore(app);
          `}
        </script>
      </head>
      <body className={`font-cairo antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
