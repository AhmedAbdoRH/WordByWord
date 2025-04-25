
"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordInput } from "@/components/word-input";
import { db } from "@/firebase/firebase-config";
import { collection, getDocs, addDoc, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore"; // Added updateDoc
import { useAuth } from "@/components/auth-provider";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { SignOut } from "@/components/sign-out";
import { Button } from "@/components/ui/button";
import { FlashcardReview } from "@/components/flashcard-review"; // Correct import
import { generateWords } from "@/ai/flows/generate-words-flow";
import { extractWords } from "@/ai/flows/extract-words-flow"; // Import the new flow
import { useRouter } from 'next/navigation';
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { Loader2 } from "lucide-react"; // Import Loader2
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components


type WordType = {
  arabic: string;
  english: string; // Ensure english is part of the type
  id: string; // ID is mandatory for Firestore operations
  uid?: string; // Added UID for user association
  difficulty?: 'easy' | 'hard'; // Optional difficulty marker
};

export default function Home() {
  const [words, setWords] = useState<WordType[]>([])
  const [loading, setLoading] = useState(true); // Loading state for words
  const { user, loading: authLoading } = useAuth(); // Auth loading state
  const [bulkInput, setBulkInput] = useState("");
  const [hardWords, setHardWords] = useState<WordType[]>([]);
  const [activeTab, setActiveTab] = useState("add"); // State to control active tab
  const [longText, setLongText] = useState(""); // State for long text input
  const [isExtracting, setIsExtracting] = useState(false); // State for extraction loading
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast


  const getWords = useCallback(async () => {
    if (!db || !user) {
      setLoading(false);
      return;
    }
    const wordsCollectionRef = collection(db, "words");
    setLoading(true);
    try {
      const q = query(wordsCollectionRef, where("uid", "==", user.uid));
      const data = await getDocs(q);
      const allWords = data.docs.map((doc) => ({ ...(doc.data() as Omit<WordType, 'id'>), id: doc.id }));
      setWords(allWords);
      const hard = allWords.filter(word => word.difficulty !== 'easy'); // Filter hard words correctly
      setHardWords(hard);

    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false);
    }
  }, [user]); // Removed db from dependencies as it's stable once initialized

  useEffect(() => {
    if (user) {
      getWords();
    } else if (!authLoading) { // Only clear/reset if auth is done loading and there's no user
      setWords([]);
      setHardWords([]);
      setLoading(false);
    }
  }, [user, getWords, authLoading]);


  const handleAddWords = async (newWords: { arabic: string; translation: string }[]) => {
    if (!db || !user) return;
    const wordsCollectionRef = collection(db, "words");

    setLoading(true);
    try {
      const wordsToAdd = newWords.map(word => ({
        arabic: word.arabic,
        english: word.translation,
        uid: user.uid,
        difficulty: 'hard', // Default new words to 'hard' (or unclassified)
      }));

      const batch = [];
      for (const word of wordsToAdd) {
        if (word.english && word.arabic) {
          batch.push(addDoc(wordsCollectionRef, word));
        } else {
          console.warn("Skipping word due to missing English or Arabic field:", word);
        }
      }
      await Promise.all(batch); // Add words in parallel
      await getWords(); // Refresh words after adding
    } catch (error) {
      console.error("Error adding words to Firestore:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHardWord = useCallback(async (wordId: string, isHard: boolean) => {
    if (!db || !user || !wordId) return;
    console.log(`Toggling hard word: ${wordId}, isHard: ${isHard}`); // Debug log
    const wordRef = doc(db, "words", wordId);
    try {
      await updateDoc(wordRef, {
        difficulty: isHard ? 'hard' : 'easy'
      });
      console.log(`Word ${wordId} marked as ${isHard ? 'hard' : 'easy'}`);

      // Update local state optimistically ONLY IF NEEDED for immediate UI feedback
      // setWords(prevWords => prevWords.map(w => w.id === wordId ? { ...w, difficulty: isHard ? 'hard' : 'easy' } : w));
      // setHardWords(prevHardWords => {
      //     const word = words.find(w => w.id === wordId);
      //     if (!word) return prevHardWords; // Should not happen
      //     return isHard
      //         ? [...prevHardWords.filter(hw => hw.id !== wordId), { ...word, difficulty: 'hard' }] // Add/update
      //         : prevHardWords.filter(hw => hw.id !== wordId); // Remove
      // });
      // Relying on getWords for consistency after review completion is generally better

    } catch (error) {
      console.error("Error updating word difficulty in Firestore:", error);
      toast({
        title: "فشل تحديث صعوبة الكلمة",
        variant: "destructive",
      });
    }
  }, [user, toast]); // Removed db, words, setWords, setHardWords

  const handleGenerateWords = async (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setLoading(true);
    try {
      const newGeneratedWords = await generateWords({ difficulty: selectedDifficulty, count: 10 });
      const formattedWords = newGeneratedWords.map(word => `${word.english} : ${word.arabic}`).join('\n');
      setBulkInput(prevBulkInput => (prevBulkInput ? prevBulkInput + '\n' : '') + formattedWords);
      toast({ title: `تم توليد ${newGeneratedWords.length} كلمات جديدة!` });
    } catch (error) {
      console.error("Error generating words:", error);
      toast({ title: "فشل توليد الكلمات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExtractWords = async () => {
    if (!longText.trim()) {
      toast({ title: "الرجاء إدخال نص للاستخراج منه.", variant: "destructive" });
      return;
    }
    setIsExtracting(true);
    try {
      const extracted = await extractWords({ text: longText, count: 15 }); // Extract up to 15 words
      if (extracted.length === 0) {
        toast({ title: "لم يتم العثور على كلمات صعبة.", variant: "default" });
      } else {
        const formattedWords = extracted.map(word => `${word.english} : ${word.arabic}`).join('\n');
        setBulkInput(prevBulkInput => (prevBulkInput ? prevBulkInput + '\n' : '') + formattedWords);
        toast({ title: `تم استخراج ${extracted.length} كلمات صعبة وإضافتها إلى صندوق الإدخال.` });
        setLongText(""); // Clear the long text input area
      }
    } catch (error) {
      console.error("Error extracting words:", error);
      toast({ title: "فشل استخراج الكلمات", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };


  const handleReviewComplete = useCallback(async (easyWordIds: string[]) => {
    if (!db || !user) return;
    console.log("Review complete. Deleting easy words:", easyWordIds);
    setLoading(true);
    try {
      const batch = [];
      for (const wordId of easyWordIds) {
        const wordRef = doc(db, "words", wordId);
        batch.push(deleteDoc(wordRef));
      }
      await Promise.all(batch); // Delete easy words in parallel
      await getWords(); // Refresh words list after deletion
      // Navigate to hard words page after successful deletion
      router.push('/hard-words');
    } catch (error) {
      console.error("Error deleting easy words:", error);
      toast({
        title: "فشل حذف الكلمات السهلة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, getWords, router, toast]); // Removed db


  if (authLoading) {
    return <div className="flex justify-center items-center h-screen">تحميل المصادقة...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-5">تطبيق كلماتي</h1>
      {user ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">مرحباً, {user.email}</span>
            <SignOut />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-5">
              <TabsTrigger value="add">إضافة و استخراج</TabsTrigger>
              <TabsTrigger value="review" disabled={words.length === 0 && !loading}>
                مراجعة الكلمات {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `(${words.length})`}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="add">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WordInput
                  onAddWords={handleAddWords}
                  bulkInput={bulkInput}
                  setBulkInput={setBulkInput}
                  onGenerateWords={handleGenerateWords}
                  isLoading={loading || isExtracting} // Disable while loading or extracting
                />
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-xl text-center">استخراج الكلمات الصعبة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={longText}
                      onChange={(e) => setLongText(e.target.value)}
                      rows={8}
                      placeholder="ألصق النص الطويل هنا لاستخراج الكلمات الصعبة مع ترجمتها..."
                      className="mb-4 bg-input/80 border-border focus:ring-ring focus:border-primary transition duration-200"
                      disabled={isExtracting || loading}
                    />
                    <Button onClick={handleExtractWords} className="w-full" disabled={isExtracting || loading || !longText.trim()}>
                      {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      استخراج وإضافة للإدخال
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="review" className="mt-5">
              {activeTab === 'review' && !loading && words.length > 0 && (
                <FlashcardReview
                  words={words.filter(w => !!w.id && !!w.english && !!w.arabic)} // Ensure words have necessary fields
                  onToggleHardWord={handleToggleHardWord}
                  onReviewComplete={handleReviewComplete}
                />
              )}
              {activeTab === 'review' && loading && (
                 <div className="text-center p-10">
                     <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                     <p className="mt-2 text-muted-foreground">جاري تحميل الكلمات للمراجعة...</p>
                 </div>
              )}
              {activeTab === 'review' && !loading && words.length === 0 && (
                  <div className="text-center p-10 text-muted-foreground">لا توجد كلمات للمراجعة حالياً.</div>
              )}
            </TabsContent>
          </Tabs>
          {/* Buttons positioned below tabs - Conditionally rendered based on active tab */}
          {activeTab === 'add' && (
             <div className="flex flex-col items-center mt-6 space-y-2 w-full max-w-md mx-auto">
                <Button
                    onClick={() => setActiveTab('review')}
                    className="w-full"
                    variant="outline"
                    disabled={loading || words.length === 0}
                >
                    مراجعة الكلمات ({words.length})
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/hard-words')}
                  className="w-full"
                  disabled={loading}
                >
                 عرض الكلمات الصعبة ({hardWords.length})
                </Button>
             </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
          <SignIn />
          <SignUp />
        </div>
      )}
    </div>
  );
}
