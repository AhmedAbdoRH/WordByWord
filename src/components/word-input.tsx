
"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components

interface WordInputProps {
  onAddWords: (words: { arabic: string; translation: string }[]) => void;
  bulkInput: string;
  setBulkInput: (input: string) => void;
  onGenerateWords: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isLoading?: boolean; // Loading state for adding/generating
}

export const WordInput: React.FC<WordInputProps> = ({ onAddWords, bulkInput, setBulkInput, onGenerateWords, isLoading = false }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false); // State for generation loading only

  const parseWords = (input: string) => {
    const lines = input.split("\n");
    const parsedWords: { arabic: string; translation: string }[] = [];

    for (const line of lines) {
      if (line.trim() === "") continue;

      const parts = line.split(/[:=\t]/).map((part) => part.trim()).filter(Boolean);

      if (parts.length === 2) {
        const [word1, word2] = parts;
        const arabicRegex = /[\u0600-\u06FF]/;
        const isWord1Arabic = arabicRegex.test(word1);
        const isWord2Arabic = arabicRegex.test(word2);

        if (isWord1Arabic !== isWord2Arabic || (!isWord1Arabic && !isWord2Arabic)) {
          const arabic = isWord1Arabic ? word1 : word2;
          const translation = isWord1Arabic ? word2 : word1;

          if (arabic && translation) {
            parsedWords.push({ arabic, translation });
          } else {
            console.warn("Skipping line due to invalid parts after split:", line);
          }
        } else {
          console.warn("Skipping line - unable to determine Arabic/Translation based on regex:", line);
        }

      } else {
        console.warn("Skipping line due to unexpected format (expected 2 parts):", line);
      }
    }

    return parsedWords;
  };

  const handleAddBulk = () => {
    if (!bulkInput.trim()) {
      toast({
        title: "الرجاء إدخال الكلمات.",
        variant: "destructive"
      });
      return;
    }

    const newWords = parseWords(bulkInput);
    if (newWords.length === 0) {
      toast({
        title: "لم يتم التعرف على أي كلمات صالحة.",
        description: "تأكد من أن كل سطر يحتوي على كلمة وترجمتها مفصولة بـ ':' أو '=' أو tab.",
        variant: "destructive"
      });
      return;
    }

    onAddWords(newWords);
    // Keep bulkInput content after adding if generated words were added to it
    // setBulkInput(""); // Consider if clearing is always desired
    toast({
      title: `تمت إضافة ${newWords.length} كلمات بنجاح.`,
    });
  };

  const handleGenerateClick = async (difficulty: 'easy' | 'medium' | 'hard') => {
    setIsGenerating(true);
    try {
      await onGenerateWords(difficulty); // Call the generation function passed via props
    } catch (error) {
      console.error("Generation failed:", error);
      toast({ title: "فشل توليد الكلمات", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="glass-card"> {/* Use Card for consistency */}
      <CardHeader>
        <CardTitle className="text-xl text-center">إضافة أو توليد كلمات</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          rows={8} // Increased rows
          placeholder={`أمثلة:
Hello : مرحباً
كتاب = Book
World	عالم
سيارة   Car
          `}
          className="mb-4 bg-input/80 border-border focus:ring-ring focus:border-primary transition duration-200"
          disabled={isLoading || isGenerating}
        />

        <div className="flex items-center space-x-4 rtl:space-x-reverse justify-center">
          <Button onClick={handleAddBulk} className="flex-1" disabled={isLoading || isGenerating || !bulkInput.trim()}>
            {isLoading && !isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            إضافة الكلمات
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1" disabled={isLoading || isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                توليد وإضافة للإدخال
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem onClick={() => handleGenerateClick('easy')} disabled={isGenerating}>
                سهلة
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateClick('medium')} disabled={isGenerating}>
                متوسط
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateClick('hard')} disabled={isGenerating}>
                صعبة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
