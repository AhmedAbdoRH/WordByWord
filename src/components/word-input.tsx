"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface WordInputProps {
  onAddWords: (words: { arabic: string; translation: string }[]) => void;
}

export const WordInput: React.FC<WordInputProps> = ({ onAddWords }) => {
  const [bulkInput, setBulkInput] = useState("");
  const { toast } = useToast();

  const parseWords = (input: string) => {
    const lines = input.split("\n");
    const parsedWords: { arabic: string; translation: string }[] = [];

    for (const line of lines) {
      if (line.trim() === "") continue;

      const parts = line.split(/[:=]/).map((part) => part.trim());
      if (parts.length === 2) {
        const [word1, word2] = parts;
        // Heuristic: If one of the words contains Arabic characters, assume it's Arabic
        const arabicRegex = /[\u0600-\u06FF]/;
        const isWord1Arabic = arabicRegex.test(word1);

        const arabic = isWord1Arabic ? word1 : word2;
        const translation = isWord1Arabic ? word2 : word1;

        parsedWords.push({ arabic, translation });
      }
    }

    return parsedWords;
  };

  const handleAddBulk = () => {
    if (!bulkInput.trim()) {
      toast({
        title: "الرجاء إدخال الكلمات.",
      });
      return;
    }

    const newWords = parseWords(bulkInput);
    if (newWords.length === 0) {
      toast({
        title: "لم يتم التعرف على أي كلمات.",
      });
      return;
    }

    onAddWords(newWords);
    setBulkInput("");
    toast({
      title: `تمت إضافة ${newWords.length} كلمات.`,
    });
  };

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-2">أضف كلمات جديدة</h2>
      <Textarea
        value={bulkInput}
        onChange={(e) => setBulkInput(e.target.value)}
        rows={5}
        placeholder={`أمثلة:
Hello : مرحباً
كتاب = Book
World	عالم
سيارة Car`}
        className="mb-2"
      />
      <Button onClick={handleAddBulk} className="w-full">
        إضافة الكلمات
      </Button>
    </div>
  );
};
