"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/lib/firebaseConfig";
import { getDoc, doc, updateDoc } from "firebase/firestore";

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams();
  const foodId = params?.id as string;

  const [foodname, setFoodName] = useState<string>("");
  const [meal, setMeal] = useState<string>("Breakfast");
  const [foodImage, setFoodImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [oldFoodImg, setOldFoodImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  // ✅ 1. ดึงข้อมูลจาก Firestore ตาม foodId
  useEffect(() => {
    if (!foodId) return;
    (async () => {
      try {
        const foodRef = doc(db, "food_cl", foodId);
        const snapshot = await getDoc(foodRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFoodName(data.foodname || "");
          setMeal(data.meal || "Breakfast");
          setPreviewImage(data.food_image_url || null);
          setOldFoodImg(data.food_image_url || null);
        } else {
          alert("ไม่พบข้อมูลอาหารนี้ในระบบ");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("❌ โหลดข้อมูลอาหารล้มเหลว:", error);
      }
    })();
  }, [foodId, router]);

  // ✅ 2. handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoodImage(file);
      setPreviewImage(URL.createObjectURL(file)); // preview blob
    }
  };

  // ✅ 3. handle update food
  const handleUpdateFood = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      let imageFoodUrl = oldFoodImg || "";

      // 🔹 ถ้ามีการเลือกรูปใหม่
      if (foodImage) {
        try {
          // ลบรูปเก่าออกจาก supabase
          if (oldFoodImg) {
            const oldFileName = oldFoodImg.split("/food_bk/")[1];
            if (oldFileName) {
              await supabase.storage.from("food_bk").remove([oldFileName]);
              console.log("✅ ลบรูปเก่าออกจาก supabase สำเร็จ");
            }
          }

          // อัปโหลดรูปใหม่
          const newImgFileName = `${Date.now()}-${foodImage.name}`;
          const { error: uploadError } = await supabase.storage
            .from("food_bk")
            .upload(newImgFileName, foodImage);

          if (uploadError) {
            alert("❌ ไม่สามารถอัปโหลดรูปได้");
            console.error(uploadError.message);
            return;
          }

          const { data: publicUrlData } = await supabase.storage
            .from("food_bk")
            .getPublicUrl(newImgFileName);

          imageFoodUrl = publicUrlData.publicUrl;
        } catch (e) {
          console.error("❌ Upload image error:", e);
        }
      }

      // 🔹 update ข้อมูลใน Firestore
      const foodRef = doc(db, "food_cl", foodId);
      await updateDoc(foodRef, {
        foodname,
        meal,
        food_image_url: imageFoodUrl,
        updated_at: new Date().toISOString(),
      });

      console.log("✅ บันทึกข้อมูลสำเร็จ");
      setShowSaveMessage(true);

      setTimeout(() => {
        setShowSaveMessage(false);
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("❌ บันทึกไม่สำเร็จ:", error);
      alert("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans text-gray-100">
      {/* Back button */}
      <div className="absolute left-4 top-4">
        <a
          href="/dashboard"
          className="flex items-center gap-2 text-gray-300 hover:text-gray-100 font-semibold"
        >
          <ArrowLeft size={20} /> Back to dashboard
        </a>
      </div>

      {/* Card */}
      <div className="flex w-full max-w-lg flex-col items-center rounded-2xl bg-gray-500 p-8 shadow-2xl backdrop-blur-md border border-gray-700">
        <h1 className="mb-6 text-3xl font-extrabold text-gray-100 sm:text-4xl">
          Edit Food
        </h1>

        <form onSubmit={handleUpdateFood} className="w-full space-y-6">
          {/* Food name */}
          <input
            type="text"
            value={foodname}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="Food Name"
            className="w-full border border-gray-600 bg-gray-700/70 px-6 py-4 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />

          {/* Meal */}
          <select
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            className="w-full border border-gray-600 bg-gray-700/70 px-6 py-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>

          {/* Image */}
          <div className="flex flex-col items-center justify-center py-4">
            <div
              className="flex flex-col items-center justify-center 
                text-white px-6 py-4 rounded-2xl 
               cursor-pointer hover:bg-gray-600 hover:border-dashed hover:border-white shadow-lg border-4 border-gray-700"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {previewImage ? (
                <div className="mt-2 flex items-center justify-center">
                  {previewImage.startsWith("blob:") ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="h-40 w-40 rounded-2xl object-cover "
                    />
                  ) : (
                    <Image
                      src={previewImage}
                      alt="Preview"
                      width={160}
                      height={160}
                      className="rounded-2xl object-cover "
                    />
                  )}
                </div>
              ) : (
                <p>กดที่นี่เพื่อเลือกรูป</p>
              )}
            </div>
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full transform bg-indigo-500 px-8 py-4 font-semibold text-gray-100 shadow-md transition duration-300 ease-in-out hover:scale-105 hover:bg-indigo-600 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={20} />
            {saving ? "Saving..." : "Save"}
          </button>
        </form>

        {showSaveMessage && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/70">
            <div className="rounded-lg bg-indigo-600 px-8 py-6 text-white text-center shadow-lg">
              <p className="font-bold">Save Successful ✅</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
