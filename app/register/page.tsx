"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
// import DB Library=============
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/lib/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

export default function RegisterPage() {
  const router = useRouter();

  const [fullname, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [genDer, setGender] = useState<string>("male"); // ✅ ค่าเริ่มต้นเป็น male
  const [userImage, setUserImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let userImgURL = "";

    // ✅ Upload image to Supabase
    if (userImage) {
      const newImgFileName = `${Date.now()}-${userImage.name}`;
      const { data, error } = await supabase.storage
        .from("user_bk")
        .upload(newImgFileName, userImage);

      if (error) {
        alert("ไม่สามารถบันทึกรูปโปรไฟล์ลง supabase ได้❌");
        console.log(error.message);
        return;
      }

      const { data: publicData } = await supabase.storage
        .from("user_bk")
        .getPublicUrl(newImgFileName);
      userImgURL = publicData.publicUrl;
      console.log("บันทึกรูปโปรไฟล์ลง supabase สำเร็จ✅");
    }

    // ✅ Save data to Firestore
    const result = await addDoc(collection(db, "user_cl"), {
      fullname,
      email,
      password,
      gender: genDer || "male", // ป้องกัน null อีกชั้น
      user_image_url: userImgURL,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result) {
      console.log({ fullname, email, password, genDer, userImgURL });
      alert("สมัครสมาชิกเรียบร้อย✅");
      router.push("/login");
    } else {
      alert("สมัครสมาชิกไม่สําเร็จ ลองใหม่อีกครั้ง❌");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans text-center text-white">
      <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-2xl bg-white/30 p-8 shadow-xl backdrop-blur-md">
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Register
        </h1>
        <form onSubmit={handleRegister} className="w-full space-y-4">
          <input
            type="text"
            placeholder="Fullname"
            value={fullname}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="my-4 flex items-center justify-center">
            <label htmlFor="file-upload" className="cursor-pointer">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-dashed border-white/50 bg-white/20 text-white shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-10 w-10 opacity-70"
                  >
                    <path d="M4 4h4.5l1.5-3h4l1.5 3H20a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
                  </svg>
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

          {/* ✅ ค่าเริ่มต้นของ select เป็น male */}
          <div>
            <label>เพศ</label>
            <select
              value={genDer}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-md border-0 bg-white/50 px-4 py-3 font-medium text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option className="text-black" value="male">
                male
              </option>
              <option className="text-black" value="female">
                female
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full transform rounded-full bg-sky-600 px-8 py-3 font-semibold text-white shadow-md transition duration-300 ease-in-out hover:scale-105 hover:bg-sky-500"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-sm">
          have an account?{" "}
          <a href="/login" className="font-semibold text-sky-800 hover:underline">
            Login here
          </a>
        </p>
      </div>
    </main>
  );
}
