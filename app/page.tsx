"use client";

import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  return (
    <main className="min-h-screen bg-black text-green-400 p-8 max-w-xl mx-auto">

      <div className="mb-16">
        <h1 className="text-6xl font-bold">
  SOUL<span className="animate-pulse">_</span>
</h1>

        <p className="mt-2 text-sm tracking-widest">
          EVERYONESANALIEN.COM
        </p>
      </div>

      <section className="mb-16">
        <h2 className="text-2xl mb-4">BECOME A MATE</h2>

        <p className="mb-4">GET YOUR HYPER-FIX!</p>

        <ul className="mb-6 space-y-2">
          <li>1. Free entry to Soul headline shows</li>
          <li>2. Discounts on merch and records</li>
          <li>3. Monthly mailing list</li>
        </ul>

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
    className="border border-green-400 bg-black p-2"
    required
  />

  <input
    name="email"
    type="email"
    placeholder="EMAIL"
    className="border border-green-400 bg-black p-2"
    required
  />

 <button
  className="border border-green-400 p-2"
  disabled={status === "loading"}
>
  {status === "loading" ? "TRANSMITTING..." : "SIGN UP"}
</button>
</form>
{status === "success" && (
  <div className="mt-4 border border-green-400 p-3">
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
  <div className="mt-4 border border-green-400 p-3">
    You're already a Mate, mate.
  </div>
)}
      </section>

      <section className="mb-16">
        <h2 className="text-2xl mb-4">UPCOMING SHOWS</h2>

        <ul className="space-y-2">
  <li>
    <a
      href="https://link.dice.fm/Md31a985f532?dice_id=Md31a985f532"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-green-300 transition-colors"
    >
      LONDON 25th June
    </a>
  </li>
</ul>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl mb-4">MERCH</h2>

        <p>COMING SOON</p>
      </section>

      <footer className="border-t border-green-400 pt-6">
  <div className="flex flex-wrap gap-6">
    <a
      href="https://www.instagram.com/everyonesanalien/"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-green-300 transition-colors"
    >
      Instagram
    </a>

    <a
      href="https://open.spotify.com/artist/4aoqsXn1YULl9y1boDeTZA?si=mPVXh9BtR4KvRUSQoIyJYA"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-green-300 transition-colors"
    >
      Spotify
    </a>

    <a
      href="https://www.tiktok.com/@everyonesanalien?lang=en-GB"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-green-300 transition-colors"
    >
      TikTok
    </a>

    <a
      href="https://www.youtube.com/channel/UCTp_Wb8HBHWMQxXvNzxkksg"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-green-300 transition-colors"
    >
      YouTube
    </a>
  </div>
</footer>

    </main>
  );
}