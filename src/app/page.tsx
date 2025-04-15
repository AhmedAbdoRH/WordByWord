"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, query, where, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { SignOut } from "@/components/sign-out";
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { generateWords } from "@/ai/flows/generate-words-flow";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { FlashcardReview } from "@/components/flashcard-review"; // Import FlashcardReview

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
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState<any>(null);
  const [wordsCollectionRef, setWordsCollectionRef] = useState<any>(null);
  const { user, loading: authLoading } = useAuth();
  const [generatedWords, setGeneratedWords] = useState<{ english: string; arabic: string }[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [bulkInput, setBulkInput] = useState(""); // Added state for word input


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
    const handleToggleHardWord = async (word: string, isHard: boolean) => {
      if (!wordsCollectionRef || !user) return;

      try {
        const q = query(wordsCollectionRef, where("uid", "==", user.uid), where("translation", "==", word));
        const data = await getDocs(q);

        data.docs.forEach(async (docSnapshot) => {
          const docRef = doc(db, "words", docSnapshot.id);
          if (isHard) {
            // Mark word as hard
            // await updateDoc(docRef, { difficulty: "hard" });
          } else {
            // Delete word if it's easy
            await deleteDoc(docRef);
          }
        });

        // Refresh words after toggling
        await getWords();
      } catch (error) {
        console.error("Error toggling hard word in Firestore:", error);
      }
    };
  const handleGenerateWords = async (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(selectedDifficulty);
    const newGeneratedWords = await generateWords({ difficulty: selectedDifficulty });
    // Format generated words into bulk input format
    const formattedWords = newGeneratedWords.map(word => `${word.english} : ${word.arabic}`).join('\n');
    // Append generated words to the bulk input
    setBulkInput(prevBulkInput => prevBulkInput + '\n' + formattedWords);
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
                <WordInput
                  onAddWords={handleAddWords}
                  bulkInput={bulkInput} // Pass bulkInput to WordInput
                  setBulkInput={setBulkInput} // Pass setBulkInput to WordInput
                  onGenerateWords={handleGenerateWords}
                />
            </TabsContent>
            <TabsContent value="review" className="mt-5">
              <FlashcardReview
                words={words}
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
