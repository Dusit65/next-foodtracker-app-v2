"use client";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";

//import DB Library==========
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

export default function AddFoodPage() {
  const router = useRouter();

  // State for form fields
  const [foodName, setFoodName] = useState<string>("");
  const [meal, setMeal] = useState("Breakfast");
  const [foodImage, setFoodImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Handle image file selection and create a URL for preview
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFoodImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSaveFood = async (event: React.FormEvent) => {
  event.preventDefault();

  if (!foodName) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  setSaving(true);

  try {
    // 1) ดึง user_id จาก localStorage
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      router.push("/login");
      return;
    }

    // 2) อัปโหลดรูปไป Supabase Storage (ถ้ามี)
    let imageFoodUrl = "";
    if (foodImage) {
      const newImgFileName = `${Date.now()}-${foodImage.name}`;
      const { error: uploadError } = await supabase.storage
        .from("food_bk")
        .upload(newImgFileName, foodImage);

      if (uploadError) {
        console.error("Upload failed:", uploadError.message);
        alert("ไม่สามารถอัปโหลดรูปภาพได้ ❌");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("food_bk")
        .getPublicUrl(newImgFileName);
      imageFoodUrl = urlData.publicUrl;
    }

    // 3) บันทึกข้อมูลลง Firestore
    const foodRef = collection(db, "food_cl");
    await addDoc(foodRef, {
      user_id: userId,
      foodname: foodName,
      meal: meal,
      fooddate: new Date().toISOString(), // yyyy-mm-dd
      food_image_url: imageFoodUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    alert("บันทึกข้อมูลสำเร็จ ✅");
    router.push("/dashboard");
  } catch (err) {
    console.error("Error saving food:", err);
    alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล ❌");
  } finally {
    setSaving(false);
  }
};

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans text-gray-100">
      {/* Navigation and header */}
      <div className="absolute left-4 top-4">
        <a
          href="/dashboard"
          className="flex items-center gap-2 text-gray-300 hover:text-gray-100 transition-colors font-semibold"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
          Back to dashboard
        </a>
      </div>

      {/* Main content card with form */}
      <div className="flex w-full max-w-lg flex-col items-center rounded-2xl bg-gray-500 p-8 shadow-2xl backdrop-blur-md border border-gray-700">
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-gray-100 sm:text-4xl">
          Add Food list
        </h1>

        <form onSubmit={handleSaveFood} className="w-full space-y-6">
          {/* Food Name Input */}
          <div className="relative">
            <input
              type="text"
              id="foodName"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="Food Name"
              className="w-full  border border-gray-600 bg-gray-700/70 px-6 py-4 font-medium text-gray-100 placeholder-gray-400 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          {/* Meal Type Dropdown */}
          <div className="relative">
            <select
              id="mealType"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              className="w-full  border border-gray-600 bg-gray-700/70 px-6 py-4 font-medium text-gray-100 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="Breakfast" className="bg-black text-gray-100">
                Breakfast
              </option>
              <option value="Lunch" className="bg-gray-800 text-gray-100">
                Lunch
              </option>
              <option value="Dinner" className="bg-gray-800 text-gray-100">
                Dinner
              </option>
              <option value="Snack" className="bg-gray-800 text-gray-100">
                Snack
              </option>
            </select>
          </div>

          {/* Image Upload */}
          {/* <div className="flex flex-col items-center ">
            <label htmlFor="foodImage" className="cursor-pointer">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Food Preview"
                  className="h-40 w-40 rounded-2xl border-4 border-gray-300 object-cover shadow-lg hover:border-dashed hover:bg-gray-600"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-4  border-gray-600 bg-gray-700/40 text-gray-200 shadow-lg hover:bg-gray-600 hover:border-dashed hover:border-white ">
                  <span className="text-sm font-semibold  text-center ">
                    Select Image
                  </span>
                </div>
              )}
              <input
                id="foodImage"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div> */}
          <div className="flex flex-col items-center justify-center">
            <div
              className="flex flex-col items-center justify-center
      text-white px-6 py-4 rounded-2xl 
      cursor-pointer hover:bg-gray-600 hover:border-dashed hover:border-white 
      shadow-lg border-4 border-gray-700"
              onClick={() => document.getElementById("foodImage")?.click()}
            >
              <input
                id="foodImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              {previewImage ? (
                
                  <img
                    src={previewImage}
                    alt="Food Preview"
                    className="h-40 w-40 rounded-2xlobject-cover "
                  />
                
              ) : (
                
                  <span className="text-sm font-semibold text-center">
                    Select Image
                  </span>
                
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full transform  bg-indigo-500 px-8 py-4 font-semibold text-gray-100 shadow-md transition duration-300 ease-in-out hover:scale-105 hover:bg-indigo-600 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={20} />
            {saving ? "Saving..." : "Save"}
          </button>
        </form>

        {/* Success message modal */}
        {showSaveMessage && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/70">
            <div className="rounded-lg bg-indigo-600 px-8 py-6 text-white text-center shadow-lg">
              <p className="font-bold">Save Successful✅</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
