"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { db } from "@/firebase/firebase-config";
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { SignOut } from "@/components/sign-out";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { generateWords } from "@/ai/flows/generate-words-flow"; // Assuming this flow exists
import { FlashcardReview } from "@/components/flashcard-review";
import { useRouter } from 'next/navigation';


type WordType = {
  arabic: string;
  english: string; // Ensure english is part of the type
  translation: string; // Keep translation for compatibility or specific use cases
  id?: string;
  uid?: string;
};


export default function Home() {
  const [words, setWords] = useState<WordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordsCollectionRef, setWordsCollectionRef] = useState<any>(null);
  const { user, loading: authLoading } = useAuth();
  const [bulkInput, setBulkInput] = useState("");
  const [hardWords, setHardWords] = useState<WordType[]>([]);
  const [activeTab, setActiveTab] = useState("add"); // State to control active tab
  const router = useRouter();


  useEffect(() => {
    if (db) {
      setWordsCollectionRef(collection(db, "words"));
    } else {
        console.log("Db not initialized yet");
    }
  }, [db]); // Depend on db initialization

  const getWords = useCallback(async () => {
    if (!wordsCollectionRef || !user) return;

    setLoading(true);
    try {
      const q = query(wordsCollectionRef, where("uid", "==", user.uid));
      const data = await getDocs(q);
      const allWords = data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as WordType));
      setWords(allWords);
      // Separate hard words
      const hard = allWords.filter(word => !word.hasOwnProperty('difficulty') || word.difficulty !== 'easy'); // Words not marked easy are considered hard/pending
      setHardWords(hard);

    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false);
    }
  }, [wordsCollectionRef, user]);

  useEffect(() => {
    if (wordsCollectionRef && user) {
      getWords();
    } else if (!user) {
      // Clear words when user logs out
      setWords([]);
      setHardWords([]);
      setLoading(false);
    }
  }, [wordsCollectionRef, user, getWords]); // Added user and getWords


  const handleAddWords = async (newWords: { arabic: string; translation: string }[]) => {
    if (!wordsCollectionRef || !user) return;

    try {
      const wordsToAdd = newWords.map(word => ({
        arabic: word.arabic,
        english: word.translation, // Assuming translation is the English word here based on parser
        translation: word.translation, // Keep original translation field if needed elsewhere
        uid: user.uid,
        // Add timestamp or default difficulty if needed
      }));

      for (const word of wordsToAdd) {
        await addDoc(wordsCollectionRef, word);
      }
      await getWords(); // Refresh words after adding
    } catch (error) {
      console.error("Error adding words to Firestore:", error);
    }
  };

  const handleToggleHardWord = useCallback(async (wordId: string, isHard: boolean) => {
      if (!db || !user || !wordId) return;

      const wordRef = doc(db, "words", wordId);
      try {
          if (isHard) {
              // Optionally update a field to mark as hard, or just ensure it's not deleted
              // For now, we assume 'hard' means keeping it, and 'easy' means deleting it later.
               console.log(`Marking word ${wordId} as hard (no DB change needed yet).`);
          } else {
               console.log(`Marking word ${wordId} for deletion after review.`);
              // We don't delete immediately, handle deletion in handleReviewComplete
          }
          // No immediate refresh needed, handle state update in FlashcardReview if necessary
      } catch (error) {
          console.error("Error toggling hard word in Firestore:", error);
      }
  }, [db, user]);


  const handleGenerateWords = async (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    try {
        const newGeneratedWords = await generateWords({ difficulty: selectedDifficulty });
        const formattedWords = newGeneratedWords.map(word => `${word.english} : ${word.arabic}`).join('\n');
        setBulkInput(prevBulkInput => (prevBulkInput ? prevBulkInput + '\n' : '') + formattedWords);
    } catch(error) {
        console.error("Error generating words:", error);
        // Add user feedback like a toast message
    }

  };

   const handleReviewComplete = useCallback(async (easyWordIds: string[]) => {
    if (!db || !user) return;
    console.log("Review complete. Deleting easy words:", easyWordIds);
    try {
        for (const wordId of easyWordIds) {
            const wordRef = doc(db, "words", wordId);
            await deleteDoc(wordRef);
        }
        await getWords(); // Refresh words after deletion
         // Navigate to hard words page after successful deletion
        // router.push('/hard-words'); // Removed auto-navigation
    } catch (error) {
        console.error("Error deleting easy words:", error);
    }
}, [db, user, getWords, router]);


  if (authLoading || (user && loading)) {
    return <div className="text-center">تحميل...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-5">تطبيق كلماتي</h1>
      {user ? (
        <>
          <div className="flex justify-end mb-4">
            <SignOut />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
             <TabsList className="w-full justify-center mb-5">
               <TabsTrigger value="add">إضافة كلمات</TabsTrigger>
               <TabsTrigger value="review" disabled={words.length === 0}>مراجعة الكلمات</TabsTrigger>
             </TabsList>
            <TabsContent value="add">
              <WordInput
                onAddWords={handleAddWords}
                bulkInput={bulkInput}
                setBulkInput={setBulkInput}
                onGenerateWords={handleGenerateWords}
              />
            </TabsContent>
             <TabsContent value="review">
               {activeTab === 'review' && ( // Only render when tab is active
                 <FlashcardReview
                   // Ensure words passed have the 'id' property
                   words={words.filter(w => w.id)} // Pass only words with IDs
                   onToggleHardWord={handleToggleHardWord}
                   onReviewComplete={handleReviewComplete}
                 />
               )}
             </TabsContent>
          </Tabs>
           {/* Buttons moved outside Tabs */}
           <div className="flex flex-col items-center mt-6 space-y-2">
              {/* Button to explicitly switch to review tab */}
             {activeTab !== 'review' && words.length > 0 && (
                <Button
                  onClick={() => setActiveTab('review')}
                  className="w-full max-w-md"
                  variant="outline"
                >
                  مراجعة الكلمات ({words.length})
                </Button>
              )}
                <Button
                  variant="secondary"
                  onClick={() => router.push('/hard-words')}
                  className="w-full max-w-md"
                >
                 عرض الكلمات الصعبة ({hardWords.length})
                </Button>
           </div>
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
