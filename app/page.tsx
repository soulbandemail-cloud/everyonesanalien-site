"use client";

import { useState } from "react";

import {
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaYoutube
} from "react-icons/fa";

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

    <main className="min-h-screen text-white p-8 md:p-12 max-w-6xl mx-auto">

      <div className="mb-12 md:mb-16">
  <h1 className="text-6xl font-bold">
    SOUL
    <span className="animate-pulse">_</span>
  </h1>
</div>
<div className="grid gap-8 md:gap-16 md:grid-cols-3 mb-4 md:mb-16">
      <section>
        <h2 className="text-2xl mb-4">BECOME A MATE</h2>
     <p className="mb-4">Sign up to Soul's monthly mailing list to get your HYPER-FIX!</p>
        <form
  className="flex flex-col gap-3 max-w-md"
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
  className="border border-white p-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] transition-colors disabled:opacity-50"
  disabled={status === "loading"}
>
  {status === "loading" ? "TRANSMITTING..." : "SIGN UP"}
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

      <section className="mt-4 md:mt-0">
  <h2 className="text-2xl mb-4">UPCOMING SHOWS</h2>

        <ul className="space-y-2">
  <li>
    <a
  href="https://link.dice.fm/Md31a985f532?dice_id=Md31a985f532"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block border border-white px-3 py-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] transition-colors"
>
  LONDON 25th June
</a>
  </li>
</ul>
      </section>
</div>
      <footer className="border-t border-white pt-6 mt-12">
  <div className="flex flex-wrap gap-6">

<a
    href="https://open.spotify.com/artist/4aoqsXn1YULl9y1boDeTZA?si=mPVXh9BtR4KvRUSQoIyJYA"
    target="_blank"
    rel="noopener noreferrer"
    className="transition-colors hover:text-[#6ee7b7]"
  >
    <FaSpotify size={28} />
  </a>


 <a
  href="https://www.instagram.com/everyonesanalien/"
  target="_blank"
  rel="noopener noreferrer"
  className="transition-colors hover:text-[#6ee7b7]"
>
  <FaInstagram size={28} />
</a>

  <a
    href="https://www.tiktok.com/@everyonesanalien?lang=en-GB"
    target="_blank"
    rel="noopener noreferrer"
    className="transition-colors hover:text-[#6ee7b7]"
  >
    <FaTiktok size={28} />
  </a>

  <a
    href="https://www.youtube.com/channel/UCTp_Wb8HBHWMQxXvNzxkksg"
    target="_blank"
    rel="noopener noreferrer"
    className="transition-colors hover:text-[#6ee7b7]"
  >
    <FaYoutube size={28} />
  </a>
</div>
</footer>

        </main>
  </>
  );
}