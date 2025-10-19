"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/lib/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function Page() {
  const router = useRouter();

  // 🔹 User States
  const [userId, setUserId] = useState<string | null>(null);
  const [fullname, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [gender, setGender] = useState<string>("male");
  const [userImage, setUserImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [oldImg, setOldImg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 1️⃣ ดึง userId จาก localStorage
  useEffect(() => {
    const uid = localStorage.getItem("user_id");
    if (!uid) {
      router.push("/login");
      return;
    }
    setUserId(uid);
  }, [router]);

  // 2️⃣ ดึงข้อมูลผู้ใช้จาก Firestore
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      const userRef = doc(db, "user_cl", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setFullName(data.fullname || "");
        setEmail(data.email || "");
        setPassword(data.password || "");
        setGender(data.gender || "male");
        setOldImg(data.user_image_url || "");
      } else {
        alert("ไม่พบข้อมูลผู้ใช้");
      }
    };

    fetchUser();
  }, [userId]);

  // 3️⃣ เมื่อเลือกรูป
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 4️⃣ อัปเดตข้อมูลผู้ใช้
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);

    try {
      let imageUrl = oldImg || "";

      // ✅ ถ้ามีรูปใหม่ → อัปโหลดไป Supabase
      if (userImage) {
        const newFileName = `${Date.now()}-${userImage.name}`;
        const { error: uploadError } = await supabase.storage
          .from("user_bk")
          .upload(newFileName, userImage);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          alert("อัปโหลดรูปไม่สำเร็จ ❌");
          setLoading(false);
          return;
        }

        const { data: imgData } = await supabase.storage
          .from("user_bk")
          .getPublicUrl(newFileName);

        imageUrl = imgData.publicUrl;
      }

      // ✅ อัปเดตข้อมูลใน Firestore
      const userRef = doc(db, "user_cl", userId);
      await updateDoc(userRef, {
        fullname,
        email,
        password,
        gender,
        user_image_url: imageUrl,
        updated_at: new Date().toISOString(),
      });

      alert("อัปเดตโปรไฟล์สำเร็จ ✅");
      localStorage.setItem("fullname", fullname);
      localStorage.setItem("userImage", imageUrl);

      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("ไม่สามารถอัปเดตข้อมูลได้ ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans text-center text-white">
      <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-2xl bg-white/30 p-8 shadow-xl backdrop-blur-md">
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Edit Profile
        </h1>

        <form onSubmit={handleUpdateProfile} className="w-full space-y-4">
          {/* Fullname */}
          <input
            type="text"
            placeholder="Fullname"
            value={fullname}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          {/* Image Upload */}
          <div className="my-4 flex flex-col items-center justify-center">
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center text-white border-4 border-dashed border-white/50 rounded-full h-28 w-28 hover:bg-gray-600 shadow-lg"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="h-28 w-28 rounded-full object-cover border-4 border-white"
                />
              ) : oldImg ? (
                <Image
                  src={oldImg}
                  alt="Current Profile"
                  width={160}
                  height={160}
                  className="rounded-full object-cover border-4 border-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-10 w-10 opacity-70"
                  >
                    <path d="M4 4h4.5l1.5-3h4l1.5 3H20a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
                  </svg>
                  <p className="text-xs mt-1">กดเพื่อเลือกรูป</p>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* Gender */}
          <select
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="male" className="text-black">Male</option>
            <option value="female" className="text-black">Female</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full transform rounded-full bg-sky-600 px-8 py-3 font-semibold text-white shadow-md transition duration-300 ease-in-out hover:scale-105 hover:bg-sky-500"
          >
            {loading ? "Saving..." : "Save Edit"}
          </button>
        </form>
      </div>
    </main>
  );
}
