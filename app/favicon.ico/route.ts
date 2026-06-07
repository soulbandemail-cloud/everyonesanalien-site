export async function GET() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path fill="#7fffd4" d="
        M50 10
        C27 10 15 30 18 52
        C21 75 38 90 50 90
        C62 90 79 75 82 52
        C85 30 73 10 50 10
        Z
      "/>
      <ellipse cx="36" cy="48" rx="10" ry="17" fill="black" transform="rotate(-22 36 48)" />
      <ellipse cx="64" cy="48" rx="10" ry="17" fill="black" transform="rotate(22 64 48)" />
    </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}