"use client";

import { useEffect, useRef, useState } from "react";

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
  const [hideCursorUfo, setHideCursorUfo] = useState(false);
  const [ringBlinking, setRingBlinking] = useState(false);

  const [flyingAliens, setFlyingAliens] = useState<
  {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    spin: number;
  }[]
>([]);

const [wishPrompt, setWishPrompt] = useState(false);
const [wish, setWish] = useState("");
const [wishPoof, setWishPoof] = useState(0);

const catchShootingStar = (e: React.PointerEvent<HTMLSpanElement>) => {
  e.preventDefault();
  e.stopPropagation();

  setWish("");
  setWishPrompt(true);
};

const closeWishPrompt = () => {
  setWishPrompt(false);
  setWishPoof(Date.now());

  setTimeout(() => {
    setWishPoof(0);
  }, 900);
};


const orbitRef = useRef<HTMLSpanElement | null>(null);
  const [ufoOrbiting, setUfoOrbiting] = useState(false);
  const [heartPulseKey, setHeartPulseKey] = useState(0);
  const [heartPulse, setHeartPulse] = useState({
  x: -100,
  y: -100,
  key: 0,
});
const toggleUfoOrbit = () => {
  setUfoOrbiting((orbiting) => !orbiting);
};

const launchAlien = (e: React.PointerEvent<SVGSVGElement>) => {
  e.preventDefault();
  e.stopPropagation();

  const rect = e.currentTarget.getBoundingClientRect();
  const angle = Math.random() * Math.PI * 2;
  const speed = 5 + Math.random() * 4;

  setFlyingAliens((aliens) => [
    ...aliens,
    {
      id: Date.now() + Math.random(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: Math.random() > 0.5 ? 1 : -1,
    },
  ]);
};

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

useEffect(() => {
  const respawnUfo = (e: PointerEvent) => {
    if (!hideCursorUfo) return;

    setUfoPos({
      x: e.clientX,
      y: e.clientY,
    });

    setHideCursorUfo(false);
  };

  window.addEventListener("pointerdown", respawnUfo);

  return () => {
    window.removeEventListener("pointerdown", respawnUfo);
  };
}, [hideCursorUfo]);

useEffect(() => {
  const interval = window.setInterval(() => {
    setFlyingAliens((aliens) => {
      if (!orbitRef.current) return aliens;

      const rect = orbitRef.current.getBoundingClientRect();
      const heartX = rect.left + rect.width / 2;
      const heartY = rect.top + rect.height / 2;

      return aliens
        .map((alien) => {
          const next = {
            ...alien,
            x: alien.x + alien.vx,
            y: alien.y + alien.vy,
          };

          const hitHeart = Math.hypot(next.x - heartX, next.y - heartY) < 42;

          if (hitHeart) {
            setRingBlinking(true);
            setUfoOrbiting(false);
            setHideCursorUfo(true);
            setHeartPulse({
              x: heartX,
              y: heartY,
              key: Date.now(),
            });

            window.setTimeout(() => {
              setRingBlinking(false);
            }, 420);

            return null;
          }

          const offscreen =
            next.x < -80 ||
            next.x > window.innerWidth + 80 ||
            next.y < -80 ||
            next.y > window.innerHeight + 80;

          return offscreen ? null : next;
        })
        .filter((alien): alien is NonNullable<typeof alien> => alien !== null);
    });
  }, 16);

  return () => window.clearInterval(interval);
}, []);

return (
  <>
    <div
      className={`fixed z-[9999] pointer-events-none ${
        ufoOrbiting || hideCursorUfo ? "opacity-0" : "opacity-100"
      } transition-opacity duration-300`}
      style={{
        left: `${ufoPos.x}px`,
        top: `${ufoPos.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg viewBox="0 0 120 80" className="w-10 h-10 opacity-95">
        <ellipse cx="60" cy="42" rx="42" ry="12" fill="white" />

        <ellipse
          cx="60"
          cy="35"
          rx="22"
          ry="17"
          fill="none"
          stroke="white"
          strokeWidth="5"
        />

        <circle cx="38" cy="44" r="3" fill="black" />
        <circle cx="60" cy="46" r="3" fill="black" />
        <circle cx="82" cy="44" r="3" fill="black" />

        <path
          d="M46 56 L34 74"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M60 58 L60 78"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M74 56 L86 74"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </div>

{flyingAliens.map((alien) => (
  <svg
    key={alien.id}
    viewBox="0 0 100 100"
    className="fixed z-[9998] pointer-events-none w-8 h-8 flying-alien-head"
    style={
      {
        left: `${alien.x}px`,
        top: `${alien.y}px`,
        "--spin": `${alien.spin}`,
      } as React.CSSProperties
    }
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

{heartPulse.key > 0 && (
  <div
    key={heartPulse.key}
    className="fixed inset-0 pointer-events-none z-[30]"
  >
    {[0, 1, 2, 3].map((i) => (
      <svg
        key={i}
        viewBox="0 0 100 100"
        className="clicked-heart-pulse absolute left-0 top-0 w-[60px] h-[60px]"
        style={{
          left: `${heartPulse.x}px`,
          top: `${heartPulse.y}px`,
          animationDelay: `${i * 120}ms`,
        }}
      >
        <path
          fill="none"
          stroke="#7fffd4"
          strokeWidth="1"
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

<div className="shooting-stars">
  <span className="shooting-star shooting-star-launch" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-1" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-2" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-3" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-4" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-5" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-6" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-7" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-8" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-9" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-10" onPointerDown={catchShootingStar}></span>
</div>

      <main className="min-h-screen text-white p-8 md:p-12 max-w-12xl mx-auto">
        <div className="flex flex-nowrap justify-center gap-10 sm:gap-10 mb-0 md:mb-4">
          <a
            href="https://open.spotify.com/artist/4aoqsXn1YULl9y1boDeTZA?si=mPVXh9BtR4KvRUSQoIyJYA"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaSpotify size={48} />
          </a>

          <a
            href="https://www.instagram.com/everyonesanalien/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaInstagram size={48} />
          </a>

          <a
            href="https://www.tiktok.com/@everyonesanalien?lang=en-GB"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaTiktok size={48} />
          </a>

          <a
            href="https://www.youtube.com/channel/UCTp_Wb8HBHWMQxXvNzxkksg"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaYoutube size={48} />
          </a>

          <a
            href="mailto:soul.band.email@gmail.com"
            className="transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaEnvelope size={48} />
          </a>
        </div>

        <div className="relative mt-12 mb-0 -mx-8 md:-mx-12 overflow-hidden">
          <p className="text-center text-white text-sm md:text-sm tracking-[0.2em] uppercase mb-[-0.7rem]">
            a band called...
          </p>
          

          <div className="flex items-center justify-center w-full mt-0">
            <div className="h-[4px] bg-white flex-1 mr-2" />

            <h1 className="relative z-10 text-6xl font-bold text-center flex justify-center items-center text-white shrink-0">
              <span className="-mr-4">S</span>

              <span 
              ref={orbitRef}
              className="group relative inline-flex items-center justify-center w-28 h-24 mx-0 overflow-hidden">
                <svg
  viewBox="0 0 100 100"
  className="absolute -translate-y-0.5 w-8 h-8 z-30 cursor-pointer"
  onClick={toggleUfoOrbit}
>
                  <path
                    className="fill-[#7fffd4] transition-colors duration-200 group-hover:fill-white group-active:fill-white"
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
  className={`orbital-ring absolute inset-0 w-full h-full z-20 cursor-pointer ${
  ringBlinking ? "orbital-ring-blink-now" : ""
}`}
  viewBox="0 0 120 80"
  onClick={toggleUfoOrbit}
>
  <ellipse
    cx="60"
    cy="39"
    rx="40"
    ry="21"
    className="fill-transparent stroke-[#7fffd4] transition-colors duration-200 group-hover:fill-[#7fffd4] group-active:fill-[#7fffd4]"
    strokeWidth="5"
  />
</svg>
{ufoOrbiting && (
  <div className="absolute inset-0 z-40 pointer-events-none">
    <svg
      viewBox="0 0 120 80"
      className="ufo-on-orbit absolute left-0 top-0 w-8 h-8 opacity-95"
    >
      <ellipse cx="60" cy="42" rx="42" ry="12" fill="white" />
      <ellipse
        cx="60"
        cy="35"
        rx="22"
        ry="17"
        fill="none"
        stroke="white"
        strokeWidth="5"
      />
      <circle cx="38" cy="44" r="3" fill="black" />
      <circle cx="60" cy="46" r="3" fill="black" />
      <circle cx="82" cy="44" r="3" fill="black" />
    </svg>
  </div>
  
)}


              </span>

              <span className="-ml-3">UL</span>
            </h1>

            <div className="h-[4px] bg-white flex-1 ml-2" />
          </div>
        </div>


{(wishPrompt || wishPoof > 0) && (
  <div className="relative flex min-h-[72px] justify-center mb-0">
    {wishPrompt && (
      <form
        className="wish-box"
        onSubmit={(e) => {
          e.preventDefault();
          closeWishPrompt();
        }}
      >
        <input
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              closeWishPrompt();
            }
          }}
          placeholder="MAKE A WISH!"
          autoFocus
          className="border border-white bg-[#00082d] focus:bg-[#00082d] px-3 py-2 text-white placeholder:text-white/70 outline-none focus:border-[#7fffd4]"
        />
      </form>
    )}

    {wishPoof > 0 && (
      <div key={wishPoof} className="wish-burst-layer">
        {[-120, -92, -66, -38, -14, 14, 38, 66, 92, 120].map((x, i) => (
          <span
            key={i}
            className="wish-burst-star"
            style={
              {
                "--burst-x": `${x}px`,
                "--delay": `${i * 45}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    )}
  </div>
)}

        <div className="grid gap-8 md:gap-16 md:grid-cols-3 mt-2 mb-4 md:mb-16">
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
                You are now a Mate of the Band!
              </div>
            )}

            {status === "error" && (
              <div className="mt-4 border border-red-500 p-3 text-red-400">
                Mating failed, please try again.
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






               <div className="fixed bottom-0 inset-x-0 z-40 overflow-hidden border-t border-white bg-[#00082d]/80 py-2">
  <div className="alien-footer-marquee flex w-max items-center">
    {[0, 1].map((track) => (
      <div key={track} className="flex items-center gap-8 px-4 shrink-0">
        {[...Array(18)].map((_, i) => (
          <svg
            key={`${track}-${i}`}
            viewBox="0 0 100 100"
            onPointerDown={launchAlien}
            className="footer-alien-head w-8 h-8 shrink-0 opacity-90 pointer-events-auto cursor-pointer"
          >
            <path
              className="footer-alien-head-fill"
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

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 mx-2 px-4 py-1 border border-[#6ee7b7] text-[#6ee7b7] text-sm md:text-base font-bold tracking-[0.25em] pointer-events-auto transition-all duration-200 hover:bg-[#6ee7b7] hover:text-[#00082d] active:bg-white active:border-white active:text-[#00082d]"
        >
          everyonesanalien.com
        </button>

        {[...Array(18)].map((_, i) => (
          <svg
            key={`${track}-b-${i}`}
            viewBox="0 0 100 100"
            onPointerDown={launchAlien}
            className="footer-alien-head w-8 h-8 shrink-0 opacity-90 pointer-events-auto cursor-pointer"
          >
            <path
              className="footer-alien-head-fill"
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
