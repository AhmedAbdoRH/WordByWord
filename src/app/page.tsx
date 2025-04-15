"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { FlashcardReview } from "@/components/flashcard-review";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { SignOut } from "@/components/sign-out";
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { generateWords } from "@/ai/flows/generate-words-flow";

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
  const { user, loading: authLoading } = useAuth();
  const [generatedWords, setGeneratedWords] = useState<{ english: string; arabic: string }[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

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

  const getWords = useCallback(async () => {
    if (!wordsCollectionRef || !user) return;

    setLoading(true);
    try {
      const q = query(wordsCollectionRef, where("uid", "==", user.uid));
      const data = await getDocs(q);
      setWords(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error("Error fetching words:", error);
      // Optionally set an error state to display an error message to the user
    } finally {
      setLoading(false);
    }
  }, [wordsCollectionRef, user]);

  useEffect(() => {
    if (wordsCollectionRef && user) {
      getWords();
    }
  }, [wordsCollectionRef, getWords, user]);

  const handleAddWords = async (newWords: { arabic: string; translation: string }[]) => {
    if (!wordsCollectionRef || !user) return;

    try {
      for (const word of newWords) {
        await addDoc(wordsCollectionRef, { ...word, uid: user.uid });
      }
      // Refresh words after adding
      await getWords();
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

  const handleGenerateWords = async () => {
    const newGeneratedWords = await generateWords({ difficulty });
    setGeneratedWords(newGeneratedWords);
  };

  if (authLoading) {
    return <div className="text-center">تحميل...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-5">VocabMaster Arabic</h1>
      {user ? (
        <>
          <div className="flex justify-end mb-4">
            <SignOut />
          </div>
          <Tabs defaultValue="add">
            <TabsList className="w-full justify-center">
              <TabsTrigger value="add">إضافة كلمات</TabsTrigger>
              <TabsTrigger value="review">مراجعة الكلمات</TabsTrigger>
            </TabsList>
            <TabsContent value="add" className="mt-5">
              <WordInput onAddWords={handleAddWords} />
              <div className="mt-4 glass-card p-4">
                <h2 className="text-lg font-semibold mb-2">Generate Words</h2>
                <div className="flex items-center space-x-4 mb-2">
                  <Select onValueChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard')}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateWords}>Generate Words</Button>
                </div>
                {generatedWords.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">Generated Words:</h3>
                    <ul>
                      {generatedWords.map((word, index) => (
                        <li key={index}>{word.english} : {word.arabic}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="review" className="mt-5">
              <FlashcardReview
                words={words}
                hardWords={hardWords}
                onToggleHardWord={handleToggleHardWord}
              />
              <div className="flex justify-center mt-4">
                <Link href="/hard-words" className="bg-secondary text-secondary-foreground p-2 rounded-md">
                  عرض الكلمات الصعبة
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignIn />
          <SignUp />
        </div>
      )}
    </div>
  );
}
