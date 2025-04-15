"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { firebaseConfig } from "@/firebase/firebase-config";

interface HardWord {
  arabic: string;
  translation: string;
}

const HardWordsPage = () => {
  const [hardWords, setHardWords] = useState<HardWord[]>([]);
    const [db, setDb] = useState<any>(null);
    const [wordsCollectionRef, setWordsCollectionRef] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
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

        try {
            const q = query(wordsCollectionRef, where("uid", "==", user.uid));
            const data = await getDocs(q);
            //setWords(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
            const allWords = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
            // Filter out "easy" words here by checking if they exist in localStorage
            const filteredWords = allWords.filter((word) => {
                const storedHardWords = localStorage.getItem('hardWords');
                if (!storedHardWords) return false; //If no hard words exists all are hard words

                const hardWordsArray = JSON.parse(storedHardWords);
                const found = hardWordsArray.some((hw: HardWord) => hw.arabic === word.arabic && hw.translation === word.translation);

                return found;
            });


            setHardWords(filteredWords);
        } catch (error) {
            console.error("Error fetching words:", error);
            // Optionally set an error state to display an error message to the user
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

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleCopyToClipboard}>
              نسخ الكلمات الصعبة
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
