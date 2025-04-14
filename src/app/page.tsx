"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { FlashcardReview } from "@/components/flashcard-review";

export default function Home() {
  const [words, setWords] = useState<{ arabic: string; translation: string }[]>([]);
  const [hardWords, setHardWords] = useState<Set<string>>(new Set());

  const handleAddWords = (newWords: { arabic: string; translation: string }[]) => {
    setWords((prevWords) => [...prevWords, ...newWords]);
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
