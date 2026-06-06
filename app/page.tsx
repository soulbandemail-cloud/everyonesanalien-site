"use client";

import { useState } from "react";

import {
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaYoutube
} from "react-icons/fa";

import { FaEnvelope } from "react-icons/fa";

import { FaRegHeart } from "react-icons/fa";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  return (
  <>
    <div className="stars">
  <span className="star star-1"></span>
  <span className="star star-2"></span>
  <span className="star star-3"></span>
  <span className="star star-4"></span>
  <span className="star star-5"></span>
</div>

    <main className="min-h-screen text-white p-8 md:p-12 max-w-8xl mx-auto">

 <div className="flex flex-wrap justify-center gap-8 mb-4 md:mb-4">

<a
    href="https://open.spotify.com/artist/4aoqsXn1YULl9y1boDeTZA?si=mPVXh9BtR4KvRUSQoIyJYA"
    target="_blank"
    rel="noopener noreferrer"
    className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
  >
    <FaSpotify size={36} />
  </a>


 <a
  href="https://www.instagram.com/everyonesanalien/"
  target="_blank"
  rel="noopener noreferrer"
  className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
>
  <FaInstagram size={36} />
</a>

  <a
    href="https://www.tiktok.com/@everyonesanalien?lang=en-GB"
    target="_blank"
    rel="noopener noreferrer"
    className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
  >
    <FaTiktok size={36} />
  </a>

  <a
    href="https://www.youtube.com/channel/UCTp_Wb8HBHWMQxXvNzxkksg"
    target="_blank"
    rel="noopener noreferrer"
    className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
  >
    <FaYoutube size={36} />
  </a>

  <a
  href="mailto:soul.band.email@gmail.com"
  className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
>
  <FaEnvelope size={36} />
</a>

</div>



<div className="relative mt-4 mb-8 w-screen left-1/2 -translate-x-1/2 overflow-hidden">
<div className="flex items-center justify-center w-full mt-4">
  <div className="h-[4px] bg-[#7fffd4] flex-1 mr-2" />

  <h1 className="relative z-10 text-6xl font-bold text-center flex justify-center items-center text-[#7fffd4] shrink-0">
    <span>S</span>

    <span className="relative inline-flex items-center justify-center w-27 h-24 mx-0">
      
      <svg viewBox="0 0 100 100" className="absolute w-8 h-8 z-10">
        <path
          fill="#7fffd4"
          d="
            M50 86
            C42 76 20 62 14 45
            C8 28 18 12 35 13
            C44 14 49 22 50 25
            C51 22 56 14 65 13
            C82 12 92 28 86 45
            C80 62 58 76 50 86
            Z
          "
        />
      </svg>

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 80">
        <ellipse
          cx="60"
          cy="40"
          rx="50"
          ry="20"
          fill="none"
          stroke="#7fffd4"
          strokeWidth="5"
          transform="rotate(-18 60 40)"
        />
      </svg>
    </span>

    <span>UL</span>
  </h1>

  <div className="h-[4px] bg-[#7fffd4] flex-1 ml-2" />
</div>
</div>

<div className="grid gap-8 md:gap-16 md:grid-cols-3 mb-4 md:mb-16">
      <section className="md:max-w-sm md:mx-auto">
        <h2 className="text-2xl mb-4">BECOME A MATE</h2>
     <p className="mb-4">Sign up to SOUL's mailing list to get your HYPER-FIX!</p>
        <form
  className="flex flex-col gap-3 max-w-md md:mx-auto"
  onSubmit={async (e) => {
  e.preventDefault();
  setStatus("loading");

  const form = e.target as HTMLFormElement;
  const formData = new FormData(form);

  const name = formData.get("name");
  const email = formData.get("email");

  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email }),
  });

if (res.ok) {
  const data = await res.json();
  form.reset();

  if (data.alreadySubscribed) {
    setStatus("already");
  } else {
    setStatus("success");
  }
} else {
  setStatus("error");
}
}}
>
  <input
    name="name"
    type="text"
    placeholder="NAME"
    className="border border-white bg-[#00082d] p-2"
    required
  />

  <input
    name="email"
    type="email"
    placeholder="EMAIL"
    className="border border-white bg-[#00082d] p-2"
    required
  />

 <button
  className="border border-white p-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] 
  active:bg-[#6ee7b7] active:border-[#6ee7b7] active:text-[#00082d] transition-all duration-200 disabled:opacity-50"
  disabled={status === "loading"}
>
  {status === "loading" ? "MATING..." : "SIGN UP"}
</button>
</form>
{status === "success" && (
  <div className="mt-4 border border-white p-3">
    WELCOME ABOARD.<br />
    You're now a Mate.<br />
    Watch your inbox for transmissions.
  </div>
)}
{status === "error" && (
  <div className="mt-4 border border-red-500 p-3 text-red-400">
    Transmission failed. Try again.
  </div>
)}
{status === "already" && (
  <div className="mt-4 border border-white p-3">
    You're already a Mate, mate.
  </div>
)}
      </section>

      <section className="mt-4 md:mt-0 md:max-w-sm md:mx-auto">
  <h2 className="text-2xl mb-4">UPCOMING SHOWS</h2>

        <ul className="space-y-2">
  <li>
    <a
  href="https://link.dice.fm/Md31a985f532?dice_id=Md31a985f532"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block border border-white px-3 py-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] 
  hover:text-[#00082d] active:bg-[#6ee7b7] active:border-[#6ee7b7] active:text-[#00082d] transition-all duration-200"
>
  LONDON 25th June
</a>
  </li>
</ul>
      </section>
      
         <section className="md:max-w-sm md:mx-auto">
        <h2 className="text-2xl mb-4">MERCH</h2>

        <p>
  Coming soon
  <span className="animate-pulse">_</span>
</p>
      </section>

</div>

        </main>
  </>
  );
}