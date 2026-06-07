"use client";

import { useEffect, useState } from "react";

import {
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaYoutube,
  FaEnvelope,
} from "react-icons/fa";

export default function Home() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "already" | "error"
  >("idle");

  const [ufoPos, setUfoPos] = useState({ x: -100, y: -100 });
  const [heartPulseKey, setHeartPulseKey] = useState(0);

  useEffect(() => {
  const moveUfo = (e: PointerEvent) => {
    setUfoPos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  window.addEventListener("pointermove", moveUfo);
  window.addEventListener("pointerdown", moveUfo);

  return () => {
    window.removeEventListener("pointermove", moveUfo);
    window.removeEventListener("pointerdown", moveUfo);
  };
}, []);

  return (
    <>
     <div
  className="fixed z-[9999] pointer-events-none"
  style={{
    left: `${ufoPos.x}px`,
    top: `${ufoPos.y}px`,
    transform: "translate(-50%, -50%)",
  }}
>
  <svg viewBox="0 0 120 80" className="w-10 h-10 opacity-95">
    <ellipse
      cx="60"
      cy="42"
      rx="42"
      ry="12"
      fill="#7fffd4"
    />

    <ellipse
      cx="60"
      cy="35"
      rx="22"
      ry="17"
      fill="none"
      stroke="#7fffd4"
      strokeWidth="5"
    />

    <circle cx="38" cy="44" r="3" fill="black" />
    <circle cx="60" cy="46" r="3" fill="black" />
    <circle cx="82" cy="44" r="3" fill="black" />

    <path
      d="M46 56 L34 74"
      stroke="#7fffd4"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.55"
    />
    <path
      d="M60 58 L60 78"
      stroke="#7fffd4"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M74 56 L86 74"
      stroke="#7fffd4"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.55"
    />
  </svg>
</div>
{heartPulseKey > 0 && (
  <div
    key={heartPulseKey}
    className="fixed inset-0 z-[30] pointer-events-none overflow-hidden"
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <svg
        key={i}
        viewBox="0 0 100 100"
        className="clicked-heart-pulse absolute left-48% top-[140px] w-[120px] h-[120px]"
        style={{
          animationDelay: `${i * 0.18}s`,
        }}
      >
        <path
          fill="none"
          stroke="#7fffd4"
          strokeWidth="2"
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
    ))}
  </div>
)}
      <div className="stars">
        <span className="star star-1"></span>
        <span className="star star-2"></span>
        <span className="star star-3"></span>
        <span className="star star-4"></span>
        <span className="star star-5"></span>
      </div>

      <main className="min-h-screen text-white p-8 md:p-12 max-w-8xl mx-auto">
        <div className="flex flex-wrap justify-center gap-10 mb-4 md:mb-4">
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
              <span className="-mr-2">S</span>

              <span className="relative inline-flex items-center justify-center w-32 h-24 mx-0 overflow-hidden">
                <svg
  viewBox="0 0 100 100"
  className="absolute w-8 h-8 z-30 cursor-pointer"
  onClick={() => setHeartPulseKey((key) => key + 1)}
>
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

                <svg
                  className="absolute inset-0 w-full h-full z-20"
                  viewBox="0 0 120 80"
                >
                  <ellipse
                    cx="60"
                    cy="40"
                    rx="40"
                    ry="18"
                    fill="none"
                    stroke="#7fffd4"
                    strokeWidth="5"
                    transform="rotate(-18 60 40)"
                  />
                </svg>
              </span>

              <span className="-ml-2">UL</span>
            </h1>

            <div className="h-[4px] bg-[#7fffd4] flex-1 ml-2" />
          </div>
        </div>

        <div className="grid gap-8 md:gap-16 md:grid-cols-3 mb-4 md:mb-16">
          <section className="md:max-w-sm md:mx-auto">
            <h2 className="text-2xl mb-4">BECOME A MATE</h2>
            <p className="mb-4">
              Sign up to SOUL&apos;s mailing list to get your HYPER-FIX!
            </p>

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
                className="border border-white p-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] active:bg-[#6ee7b7] active:border-[#6ee7b7] active:text-[#00082d] transition-all duration-200 disabled:opacity-50"
                disabled={status === "loading"}
              >
                {status === "loading" ? "MATING..." : "SIGN UP"}
              </button>
            </form>

            {status === "success" && (
              <div className="mt-4 border border-white p-3">
                WELCOME ABOARD.
                <br />
                You&apos;re now a Mate.
                <br />
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
                You&apos;re already a Mate, mate.
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
                  className="inline-block border border-white px-3 py-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] active:bg-[#6ee7b7] active:border-[#6ee7b7] active:text-[#00082d] transition-all duration-200"
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
               <div className="fixed bottom-0 left-0 z-40 w-screen overflow-hidden border-t border-[#7fffd4] bg-[#00082d]/80 py-2 pointer-events-none">
  <div className="alien-footer-marquee flex w-max items-center">
    {[0, 1].map((track) => (
      <div key={track} className="flex items-center gap-8 px-4 shrink-0">
        {[...Array(18)].map((_, i) => (
          <svg
            key={`${track}-${i}`}
            viewBox="0 0 100 100"
            className="w-8 h-8 shrink-0 opacity-90"
          >
            <path
              fill="#7fffd4"
              d="
                M50 10
                C27 10 15 30 18 52
                C21 75 38 90 50 90
                C62 90 79 75 82 52
                C85 30 73 10 50 10
                Z
              "
            />
            <ellipse cx="36" cy="48" rx="9" ry="15" fill="black" transform="rotate(-22 36 48)" />
            <ellipse cx="64" cy="48" rx="9" ry="15" fill="black" transform="rotate(22 64 48)" />
            <path
              d="M42 68 C47 72 53 72 58 68"
              fill="none"
              stroke="black"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ))}

        <span className="shrink-0 px-6 text-[#6ee7b7] text-sm md:text-base font-bold tracking-[0.25em]">
          everyonesanalien.com
        </span>

        {[...Array(18)].map((_, i) => (
          <svg
            key={`${track}-b-${i}`}
            viewBox="0 0 100 100"
            className="w-8 h-8 shrink-0 opacity-90"
          >
            <path
              fill="#7fffd4"
              d="
                M50 10
                C27 10 15 30 18 52
                C21 75 38 90 50 90
                C62 90 79 75 82 52
                C85 30 73 10 50 10
                Z
              "
            />
            <ellipse cx="36" cy="48" rx="9" ry="15" fill="black" transform="rotate(-22 36 48)" />
            <ellipse cx="64" cy="48" rx="9" ry="15" fill="black" transform="rotate(22 64 48)" />
            <path
              d="M42 68 C47 72 53 72 58 68"
              fill="none"
              stroke="black"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ))}
      </div>
    ))}
  </div>
</div>
      </main>
    </>
  );
}