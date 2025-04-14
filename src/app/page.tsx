
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { FlashcardReview } from "@/components/flashcard-review";
import { db } from "@/firebase/firebase-config";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

export default function Home() {
  const [words, setWords] = useState<{ arabic: string; translation: string; id?: string }[]>([]);
  const [hardWords, setHardWords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const wordsCollectionRef = collection(db, "words");

  useEffect(() => {
    const getWords = async () => {
      setLoading(true);
      const data = await getDocs(wordsCollectionRef);
      setWords(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as { arabic: string; translation: string; id: string })));
      setLoading(false);
    };

    getWords();
  }, []);

  const handleAddWords = async (newWords: { arabic: string; translation: string }[]) => {
    try {
      for (const word of newWords) {
        await addDoc(wordsCollectionRef, word);
      }
      // Refresh words after adding
      const data = await getDocs(wordsCollectionRef);
      setWords(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as { arabic: string; translation: string; id: string })));
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

  // Placeholder for loading state
  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-5">VocabMaster Arabic</h1>
      <Tabs defaultActiveKey="add">
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

    