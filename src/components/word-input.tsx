
"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Loader2 } from "lucide-react"; // Import Loader2

interface WordInputProps {
  onAddWords: (words: { arabic: string; translation: string }[]) => void;
  bulkInput: string;
  setBulkInput: (input: string) => void;
  onGenerateWords: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isLoading?: boolean; // Optional loading prop
}

export const WordInput: React.FC<WordInputProps> = ({ onAddWords, bulkInput, setBulkInput, onGenerateWords, isLoading = false }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false); // State for generation loading

  const parseWords = (input: string) => {
    const lines = input.split("\n");
    const parsedWords: { arabic: string; translation: string }[] = [];

    for (const line of lines) {
      if (line.trim() === "") continue;

      // Improved parsing: Handles various separators like ':', '=', '\t' (tab)
      const parts = line.split(/[:=\t]/).map((part) => part.trim()).filter(Boolean); // Filter out empty parts

      if (parts.length === 2) {
        const [word1, word2] = parts;
        // Heuristic: If one of the words contains Arabic characters, assume it's Arabic
        const arabicRegex = /[\u0600-\u06FF]/;
        const isWord1Arabic = arabicRegex.test(word1);
        const isWord2Arabic = arabicRegex.test(word2);

        // Basic check to ensure one is likely Arabic and the other isn't (or both are not Arabic - less likely for user input)
        if (isWord1Arabic !== isWord2Arabic || (!isWord1Arabic && !isWord2Arabic)) {
            const arabic = isWord1Arabic ? word1 : word2;
            const translation = isWord1Arabic ? word2 : word1; // Assume the other is the translation (likely English)

            if (arabic && translation) { // Ensure both parts are valid
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
        variant: "destructive" // Use destructive variant for errors/warnings
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
    setBulkInput(""); // Clear input after successful add
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
    <div className="glass-card p-6 rounded-lg shadow-lg"> {/* Enhanced styling */}
      <h2 className="text-xl font-semibold mb-4 text-center">أضف كلمات جديدة</h2> {/* Larger title, centered */}
      <Textarea
        value={bulkInput}
        onChange={(e) => setBulkInput(e.target.value)}
        rows={6} // Slightly more rows
        placeholder={`أمثلة:
Hello : مرحباً
كتاب = Book
World	عالم
سيارة   Car`}
        className="mb-4 bg-input/80 border-border focus:ring-ring focus:border-primary transition duration-200" // Improved styling
        disabled={isLoading || isGenerating} // Disable while loading/generating
      />

      <div className="flex items-center space-x-4 rtl:space-x-reverse justify-center"> {/* Centered buttons */}
        <Button onClick={handleAddBulk} className="w-1/2" disabled={isLoading || isGenerating}>
           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
           إضافة الكلمات
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-1/2" disabled={isLoading || isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              توليد كلمات
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end"> {/* Align dropdown */}
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
    </div>
  );
};

    