"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { db } from "@/firebase/firebase-config";
import { getDocs, collection, query, where, deleteDoc, doc } from "firebase/firestore";

interface HardWord {
  arabic: string;
  translation: string;
  id: string;
}

const HardWordsPage = () => {
  const [hardWords, setHardWords] = useState<HardWord[]>([]);
  const [wordsCollectionRef, setWordsCollectionRef] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!db) {
      console.error("Firebase is not initialized.");
      return;
    }
    setWordsCollectionRef(collection(db, "words"));
  }, []);

  const getWords = useCallback(async () => {
    if (!wordsCollectionRef || !user) return;

    try {
      const q = query(wordsCollectionRef, where("uid", "==", user.uid));
      const data = await getDocs(q);
      const allWords = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setHardWords(allWords);
    } catch (error) {
      console.error("Error fetching words:", error);
    }
  }, [wordsCollectionRef, user]);

  useEffect(() => {
    if (wordsCollectionRef && user) {
      getWords();
    }
  }, [wordsCollectionRef, getWords, user]);

  const handleCopyToClipboard = () => {
    const textToCopy = hardWords.map(word => `${word.arabic}: ${word.translation}`).join("\n");
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "تم نسخ الكلمات الصعبة إلى الحافظة!",
    });
  };

  const handleDeleteAllWords = async () => {
    if (!wordsCollectionRef || !user) return;

    try {
      const q = query(wordsCollectionRef, where("uid", "==", user.uid));
      const data = await getDocs(q);

      // Delete each document individually
      data.docs.forEach(async (docSnapshot) => {
        const docRef = doc(db, "words", docSnapshot.id);
        await deleteDoc(docRef);
      });

      setHardWords([]); // Clear the local state
      toast({
        title: "تم حذف جميع الكلمات الصعبة!",
      });
    } catch (error) {
      console.error("Error deleting all words:", error);
      toast({
        title: "فشل حذف جميع الكلمات.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-5">الكلمات الصعبة</h1>

      {hardWords.length > 0 ? (
        <>
          <Card className="glass-card p-6 w-full max-w-md mx-auto mb-4">
            <ul className="list-disc list-inside">
              {hardWords.map((word, index) => (
                <li key={index}>
                  {word.arabic} : {word.translation}
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={handleCopyToClipboard}>
              نسخ الكلمات الصعبة
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllWords}>
              حذف الكل
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center">لا توجد كلمات صعبة مخزنة حتى الآن.</div>
      )}
    </div>
  );
};

export default HardWordsPage;
