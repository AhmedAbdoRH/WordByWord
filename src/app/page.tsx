"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { FlashcardReview } from "@/components/flashcard-review";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export default function Home() {
  const [words, setWords] = useState<{ arabic: string; translation: string; id?: string }[]>([]);
  const [hardWords, setHardWords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState<any>(null);
  const [wordsCollectionRef, setWordsCollectionRef] = useState<any>(null);

  useEffect(() => {
    // Initialize Firebase and Firestore only on the client side
    if (!firebaseConfig.apiKey) {
      console.error("Firebase configuration is missing. Ensure all NEXT_PUBLIC_FIREBASE_* environment variables are set.");
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      setDb(firestore);
      setWordsCollectionRef(collection(firestore, "words"));
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, []);

  useEffect(() => {
    const getWords = async () => {
      if (!wordsCollectionRef) return;

      setLoading(true);
      try {
        const data = await getDocs(wordsCollectionRef);
        setWords(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error("Error fetching words:", error);
        // Optionally set an error state to display an error message to the user
      } finally {
        setLoading(false);
      }
    };

    if (wordsCollectionRef) {
      getWords();
    }
  }, [wordsCollectionRef]);

  const handleAddWords = async (newWords: { arabic: string; translation: string }[]) => {
    if (!wordsCollectionRef) return;

    try {
      for (const word of newWords) {
        await addDoc(wordsCollectionRef, word);
      }
      // Refresh words after adding
      const data = await getDocs(wordsCollectionRef);
      setWords(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error("Error adding words to Firestore:", error);
    }
  };

  const handleToggleHardWord = (word: string, isHard: boolean) => {
    setHardWords((prevHardWords) => {
      const newHardWords = new Set(prevHardWords);
      if (isHard) {
        newHardWords.add(word);
      } else {
        newHardWords.delete(word);
      }
      return newHardWords;
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-5">VocabMaster Arabic</h1>
      <Tabs defaultValue="add">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="add">إضافة كلمات</TabsTrigger>
          <TabsTrigger value="review">مراجعة الكلمات</TabsTrigger>
        </TabsList>
        <TabsContent value="add" className="mt-5">
          <WordInput onAddWords={handleAddWords} />
        </TabsContent>
        <TabsContent value="review" className="mt-5">
          <FlashcardReview
            words={words}
            hardWords={hardWords}
            onToggleHardWord={handleToggleHardWord}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
